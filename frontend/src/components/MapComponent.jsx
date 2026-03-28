/**
 * MapComponent.jsx — Çok Rota Destekli Harita
 *
 * Seçili rota: parlak + tam opak
 * Diğer rotalar: soluk + kesik çizgi + hover ile öne çıkabilir
 * Harita üzerinde tıklayarak rota seçilebilir
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapComponent({ layers, routeStatus, firePoints = [], selectedRouteId, onSelectRoute }) {
    const mapRef              = useRef(null);
    const fireLayerGroupRef   = useRef(L.layerGroup());
    const bufferLayerGroupRef = useRef(L.layerGroup());
    const routeLayerGroupRef  = useRef(L.layerGroup());

    /* ─── Harita Başlatma ──────────────────────── */
    useEffect(() => {
        if (!mapRef.current) {
            const map = L.map('map-container', {
                zoomControl: false,
                attributionControl: true,
            }).setView([39.15, 35.44], 6);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
            }).addTo(map);

            map.createPane('roadsPane');
            map.getPane('roadsPane').style.zIndex = 350;
            map.getPane('roadsPane').classList.add('leaflet-roads-pane');
            L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}{r}.png', {
                pane: 'roadsPane', opacity: 0.65,
            }).addTo(map);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png').addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            mapRef.current = map;
            bufferLayerGroupRef.current.addTo(map);
            routeLayerGroupRef.current.addTo(map);
        }
    }, []);

    /* ─── Yangın Noktaları + Tampon Daireler ──── */
    useEffect(() => {
        const fireGroup   = fireLayerGroupRef.current;
        const bufferGroup = bufferLayerGroupRef.current;
        fireGroup.clearLayers();
        bufferGroup.clearLayers();

        if (!firePoints.length) return;

        const colorMap = {
            green:  { border: '#22c55e', fill: '#4ade80' },
            yellow: { border: '#eab308', fill: '#facc15' },
            red:    { border: '#ff4500', fill: '#ff6b35' },
            gray:   { border: '#9ca3af', fill: '#d1d5db' },
        };
        const iconClass = {
            green: 'text-green-500', yellow: 'text-yellow-500',
            red: 'text-orange-500',  gray: 'text-gray-400',
        };

        firePoints.forEach(point => {
            const colors = colorMap[point.color] || colorMap.gray;
            const dangerRadius = point.color === 'red' ? 28000 : point.color === 'yellow' ? 20000 : 12000;

            // Tehlike tampon dairesi
            bufferGroup.addLayer(L.circle([point.lat, point.lon], {
                radius: dangerRadius, weight: 1, dashArray: '4 6',
                color:       point.color === 'red' ? '#ff4500' : point.color === 'yellow' ? '#eab308' : '#22c55e',
                fillColor:   point.color === 'red' ? '#ff4500' : point.color === 'yellow' ? '#eab308' : '#22c55e',
                fillOpacity: 0.07, opacity: 0.45,
            }));

            // Nokta marker
            const circle = L.circleMarker([point.lat, point.lon], {
                radius: point.color === 'red' ? 8 : point.color === 'yellow' ? 6 : 4,
                color: colors.border, fillColor: colors.fill, fillOpacity: 0.75, weight: 2,
            });
            circle.bindPopup(
                `<div style="font-family:Inter,sans-serif;min-width:170px;padding:4px 0">
                    <div style="font-weight:800;font-size:13px;margin-bottom:6px;color:#1a1a2e">${point.level}</div>
                    <div style="font-size:11px;color:#555;margin-bottom:2px">🌡 Brightness: <b>${point.brightness.toFixed(1)} K</b></div>
                    <div style="font-size:11px;color:#555;margin-bottom:2px">📍 ${point.lat.toFixed(4)}°N, ${point.lon.toFixed(4)}°E</div>
                    <div style="font-size:10px;color:#888;margin-top:4px;border-top:1px solid #eee;padding-top:4px">Kaynak: NASA FIRMS VIIRS</div>
                </div>`
            );
            fireGroup.addLayer(circle);

            // İkon marker
            fireGroup.addLayer(L.marker([point.lat, point.lon], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<span class="material-symbols-outlined ${iconClass[point.color] || 'text-gray-400'} bg-white/90 rounded-full p-1 shadow-lg" style="font-variation-settings:'FILL' 1;font-size:14px">local_fire_department</span>`,
                    iconSize: [24, 24], iconAnchor: [12, 12],
                }),
            }));
        });
    }, [firePoints]);

    /* ─── Katman Toggle ────────────────────────── */
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (layers.fire) {
            fireLayerGroupRef.current.addTo(map);
            bufferLayerGroupRef.current.addTo(map);
        } else {
            fireLayerGroupRef.current.remove();
            bufferLayerGroupRef.current.remove();
        }
    }, [layers]);

    /* ─── Çok Rota Görselleştirme ──────────────── */
    useEffect(() => {
        if (!mapRef.current) return;
        const rLayer = routeLayerGroupRef.current;
        rLayer.clearLayers();

        if (routeStatus.status !== 'success' || !routeStatus.payload) return;

        const { routes, fromGeo, toGeo } = routeStatus.payload;
        if (!routes?.length) return;

        // Seçili olmayan rotaları önce çiz (altda kalırlar)
        const drawOrder = [
            ...routes.filter(r => r.id !== selectedRouteId),
            ...routes.filter(r => r.id === selectedRouteId),
        ];

        drawOrder.forEach(route => {
            if (!route?.route?.geometry?.coordinates) return;

            const isSelected = route.id === selectedRouteId;
            const latLngs = route.route.geometry.coordinates.map(c => [c[1], c[0]]);

            // Shadow sadece seçilene
            if (isSelected) {
                rLayer.addLayer(L.polyline(latLngs, {
                    color: '#000', weight: 12, opacity: 0.12,
                    lineCap: 'round', lineJoin: 'round',
                }));
            }

            // Ana çizgi
            const polyline = L.polyline(latLngs, {
                color:     isSelected ? route.color : '#64748b',
                weight:    isSelected ? 5 : 3,
                opacity:   isSelected ? 0.95 : 0.28,
                dashArray: isSelected ? null : '8 10',
                lineCap:   'round',
                lineJoin:  'round',
            });

            // Hover efekti
            polyline.on('mouseover', () => {
                if (!isSelected) polyline.setStyle({ opacity: 0.65, weight: 4, color: route.color });
            });
            polyline.on('mouseout', () => {
                if (!isSelected) polyline.setStyle({ opacity: 0.28, weight: 3, color: '#64748b' });
            });

            // Tıklayarak seçim
            polyline.on('click', () => {
                if (onSelectRoute && !isSelected) onSelectRoute(route.id);
            });

            // Cursor ayarı
            polyline.on('add', () => {
                if (polyline._path) polyline._path.style.cursor = 'pointer';
            });

            rLayer.addLayer(polyline);
        });

        // Seçili rota için başlangıç/bitiş markerları
        const selectedRoute = routes.find(r => r.id === selectedRouteId);
        if (selectedRoute && fromGeo && toGeo) {
            rLayer.addLayer(L.marker([fromGeo.lat, fromGeo.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="flex flex-col items-center">
                        <span class="material-symbols-outlined text-emerald-500 bg-white rounded-full p-1.5 shadow-xl" style="font-variation-settings:'FILL' 1;font-size:22px">my_location</span>
                        <div class="text-[8px] font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow text-gray-700 whitespace-nowrap border border-emerald-200">${fromGeo.name}</div>
                    </div>`,
                    iconSize: [44, 56], iconAnchor: [22, 28],
                }),
            }));

            rLayer.addLayer(L.marker([toGeo.lat, toGeo.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="flex flex-col items-center">
                        <span class="material-symbols-outlined text-red-500 bg-white rounded-full p-1.5 shadow-xl" style="font-variation-settings:'FILL' 1;font-size:22px">location_on</span>
                        <div class="text-[8px] font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow text-gray-700 whitespace-nowrap border border-red-200">${toGeo.name}</div>
                    </div>`,
                    iconSize: [44, 56], iconAnchor: [22, 28],
                }),
            }));

            // Seçili rotaya sığdır
            const latLngs = selectedRoute.route.geometry.coordinates.map(c => [c[1], c[0]]);
            mapRef.current.fitBounds(L.latLngBounds(latLngs).pad(0.18));
        }
    }, [routeStatus, selectedRouteId, onSelectRoute]);

    return (
        <>
            <div id="map-container" className="fixed inset-0 z-0 w-full h-full" />
            <div className="fixed inset-0 map-overlay pointer-events-none z-10 w-full h-full" />
        </>
    );
}
