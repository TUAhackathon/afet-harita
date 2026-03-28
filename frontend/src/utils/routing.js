import { fireData, floodData } from './data';
import L from 'leaflet';

export async function geocode(placeName) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&countrycodes=tr&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'tr' } });
    const data = await res.json();
    if (data.length === 0) return null;
    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name.split(',')[0]
    };
}

export async function getRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes.length) return null;
    return data.routes[0];
}

export function calculateSafety(routeCoords) {
    const hazardZones = [...fireData, ...floodData];
    if (hazardZones.length === 0) return 95;

    let dangerPoints = 0;
    const totalPoints = routeCoords.length;

    routeCoords.forEach(coord => {
        hazardZones.forEach(hz => {
            // Leaflet LatLng distance
            const p1 = L.latLng(coord[1], coord[0]);
            const p2 = L.latLng(hz.coords[0], hz.coords[1]);
            const dist = p1.distanceTo(p2);
            if (dist < hz.radius * 1.5) dangerPoints++;
        });
    });

    const dangerRatio = dangerPoints / (totalPoints * hazardZones.length);
    return Math.max(40, Math.round(100 - dangerRatio * 100));
}
