import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { floodData } from '../utils/data';

export default function MapComponent({ layers, routeStatus, firePoints = [] }) {
    const mapRef = useRef(null);
    const fireLayerGroupRef = useRef(L.layerGroup());
    const floodLayerGroupRef = useRef(L.layerGroup());
    const routeLayerGroupRef = useRef(L.layerGroup());

    useEffect(() => {
        if (!mapRef.current) {
            // Initialize main map centered on Turkey
            const map = L.map('map-container', {
                zoomControl: false,
                attributionControl: true
            }).setView([39.15, 35.44], 6);

            // Base Map Layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO'
            }).addTo(map);

            // Red roads overlay
            map.createPane('roadsPane');
            map.getPane('roadsPane').style.zIndex = 350;
            map.getPane('roadsPane').classList.add('leaflet-roads-pane');

            L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}{r}.png', {
                pane: 'roadsPane',
                opacity: 0.7,
                attribution: ''
            }).addTo(map);

            // Labels Layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: ''
            }).addTo(map);

            // Zoom Control
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            mapRef.current = map;

            // Generate Flood Markers (static data)
            floodData.forEach(d => {
                const circle = L.circle(d.coords, {
                    color: '#1e90ff', fillColor: '#4dabff', fillOpacity: 0.3, weight: 2, radius: d.radius
                });
                const marker = L.marker(d.coords, {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div class="flex flex-col items-center"><span class="material-symbols-outlined text-blue-500 bg-white/90 rounded-full p-1 shadow-lg" style="font-variation-settings: 'FILL' 1; font-size: 18px;">water</span><div class="text-[8px] font-bold mt-1 bg-white/90 px-2 rounded text-gray-800 whitespace-nowrap">${d.name}</div></div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                });
                floodLayerGroupRef.current.addLayer(circle);
                floodLayerGroupRef.current.addLayer(marker);
            });
            
            // Add route layer to map
            routeLayerGroupRef.current.addTo(map);
        }
    }, []);

    // firePoints prop değiştiğinde harita katmanını yeniden oluştur
    useEffect(() => {
        const fireGroup = fireLayerGroupRef.current;
        fireGroup.clearLayers();

        if (firePoints.length === 0) return;

        const colorMap = {
            green: { border: '#22c55e', fill: '#4ade80' },
            yellow: { border: '#eab308', fill: '#facc15' },
            red: { border: '#ff4500', fill: '#ff6b35' },
            gray: { border: '#9ca3af', fill: '#d1d5db' },
        };
        const iconColorClass = {
            green: 'text-green-500',
            yellow: 'text-yellow-500',
            red: 'text-orange-500',
            gray: 'text-gray-400',
        };

        firePoints.forEach(point => {
            const colors = colorMap[point.color] || colorMap.gray;

            const circle = L.circleMarker([point.lat, point.lon], {
                radius: point.color === 'red' ? 8 : point.color === 'yellow' ? 6 : 4,
                color: colors.border,
                fillColor: colors.fill,
                fillOpacity: 0.7,
                weight: 2,
            });
            circle.bindPopup(
                `<div style="font-family: Inter, sans-serif; min-width: 160px;">
                    <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${point.level}</div>
                    <div style="font-size: 11px; color: #555;">Brightness: <b>${point.brightness.toFixed(1)}</b></div>
                    <div style="font-size: 11px; color: #555;">Konum: ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}</div>
                </div>`
            );
            fireGroup.addLayer(circle);

            const marker = L.marker([point.lat, point.lon], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="flex flex-col items-center"><span class="material-symbols-outlined ${iconColorClass[point.color] || 'text-gray-400'} bg-white/90 rounded-full p-1 shadow-lg" style="font-variation-settings: 'FILL' 1; font-size: 14px;">local_fire_department</span></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            });
            fireGroup.addLayer(marker);
        });
    }, [firePoints]);

    // Toggle layers on/off
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (layers.fire) fireLayerGroupRef.current.addTo(map);
        else fireLayerGroupRef.current.remove();

        if (layers.flood) floodLayerGroupRef.current.addTo(map);
        else floodLayerGroupRef.current.remove();
    }, [layers]);

    // Handle Route updates
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        const rLayer = routeLayerGroupRef.current;

        rLayer.clearLayers();

        if (routeStatus.status === 'success' && routeStatus.payload) {
            const { routeObj, fromGeo, toGeo } = routeStatus.payload;
            
            if (routeObj && routeObj.geometry && routeObj.geometry.coordinates) {
                const coords = routeObj.geometry.coordinates;
                const latLngs = coords.map(c => [c[1], c[0]]);
                
                // Polyline shadow
                rLayer.addLayer(L.polyline(latLngs, {
                    color: '#000000', weight: 8, opacity: 0.3
                }));

                // Main Polyline
                rLayer.addLayer(L.polyline(latLngs, {
                    color: '#3fff8b', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
                }));

                // Start Marker
                rLayer.addLayer(L.marker([fromGeo.lat, fromGeo.lng], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div class="flex flex-col items-center"><span class="material-symbols-outlined text-emerald-500 bg-white rounded-full p-1.5 shadow-lg" style="font-variation-settings: 'FILL' 1; font-size: 20px;">my_location</span><div class="text-[8px] font-bold mt-1 bg-white px-2 py-0.5 rounded shadow text-gray-800 whitespace-nowrap">${fromGeo.name}</div></div>`,
                        iconSize: [40, 50],
                        iconAnchor: [20, 25]
                    })
                }));

                // End Marker
                rLayer.addLayer(L.marker([toGeo.lat, toGeo.lng], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div class="flex flex-col items-center"><span class="material-symbols-outlined text-red-500 bg-white rounded-full p-1.5 shadow-lg" style="font-variation-settings: 'FILL' 1; font-size: 20px;">location_on</span><div class="text-[8px] font-bold mt-1 bg-white px-2 py-0.5 rounded shadow text-gray-800 whitespace-nowrap">${toGeo.name}</div></div>`,
                        iconSize: [40, 50],
                        iconAnchor: [20, 25]
                    })
                }));

                // Zoom map to bounds
                map.fitBounds(L.latLngBounds(latLngs).pad(0.15));
            }
        }
        
    }, [routeStatus]);

    return (
        <>
            <div id="map-container" className="fixed inset-0 z-0 w-full h-full"></div>
            <div className="fixed inset-0 map-overlay pointer-events-none z-10 w-full h-full"></div>
        </>
    );
}
