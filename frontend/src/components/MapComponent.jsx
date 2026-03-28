import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { fireData, floodData } from '../utils/data';

export default function MapComponent({ layers, routeStatus }) {
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

            // Generate Fire Markers
            fireData.forEach(d => {
                const circle = L.circle(d.coords, {
                    color: '#ff4500', fillColor: '#ff6b35', fillOpacity: 0.35, weight: 2, radius: d.radius
                });
                const marker = L.marker(d.coords, {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div class="flex flex-col items-center"><span class="material-symbols-outlined text-orange-500 bg-white/90 rounded-full p-1 shadow-lg" style="font-variation-settings: 'FILL' 1; font-size: 18px;">local_fire_department</span><div class="text-[8px] font-bold mt-1 bg-white/90 px-2 rounded text-gray-800 whitespace-nowrap">${d.name}</div></div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                });
                fireLayerGroupRef.current.addLayer(circle);
                fireLayerGroupRef.current.addLayer(marker);
            });

            // Generate Flood Markers
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
        
        const map = mapRef.current;

        // Toggle Layers dynamically
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
        } else if (routeStatus.status === 'idle') {
            // map.setView([39.15, 35.44], 6); // Reset zoom? Optional.
        }
        
    }, [routeStatus]);

    return (
        <>
            <div id="map-container" className="fixed inset-0 z-0 w-full h-full"></div>
            <div className="fixed inset-0 map-overlay pointer-events-none z-10 w-full h-full"></div>
        </>
    );
}
