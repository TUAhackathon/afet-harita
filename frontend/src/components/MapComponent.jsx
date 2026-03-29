/**
 * MapComponent.jsx — Çok Rota Destekli Harita + Meteoroloji Birleşimi
 *
 * Özellikler:
 * - Seçili rota: parlak + tam opak
 * - Diğer rotalar: soluk + kesik çizgi
 * - Yangın tampon bölgeleri (Danger Buffers)
 * - Rüzgar Vektörleri (Anlık Meteoroloji Okları)
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { fetchAiPredictionForPoint } from '../services/api';

    export default function MapComponent({ layers, routeStatus, firePoints = [], selectedRouteId, onSelectRoute, region = 'tr' }) {
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

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png').addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            mapRef.current = map;
            routeLayerGroupRef.current.addTo(map);
        }
    }, []);

    /* ─── Bölge Navigasyonu ────────────────────── */
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        if (region === 'tr') {
            map.flyTo([39.15, 35.44], 6, { duration: 1.5 });
        } else if (region === 'in') {
            map.flyTo([22.5, 78.9], 5, { duration: 1.5 });
        }
    }, [region]);

    /* ─── Yangın Noktaları + Tampon Daireler + Rüzgar Vektörleri ──── */
    useEffect(() => {
        if (!mapRef.current) return;
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

            // ⭕ Tehlike tampon dairesi
            bufferGroup.addLayer(L.circle([point.lat, point.lon], {
                radius: dangerRadius, weight: 1, dashArray: '4 6',
                color:       point.color === 'red' ? '#ff4500' : point.color === 'yellow' ? '#eab308' : '#22c55e',
                fillColor:   point.color === 'red' ? '#ff4500' : point.color === 'yellow' ? '#eab308' : '#22c55e',
                fillOpacity: 0.07, opacity: 0.45,
            }));

            // 📍 Nokta marker
            const circle = L.circleMarker([point.lat, point.lon], {
                radius: point.color === 'red' ? 8 : point.color === 'yellow' ? 6 : 4,
                color: colors.border, fillColor: colors.fill, fillOpacity: 0.75, weight: 2,
            });
            
            const pointId = `ai-pt-${Math.random().toString(36).substring(2, 9)}`;

            const popupHtml = `<div style="font-family:Inter,sans-serif;min-width:180px;padding:4px 0">
                    <div style="font-weight:800;font-size:13px;margin-bottom:6px;color:#1a1a2e">${point.level}</div>
                    
                    <div id="${pointId}" style="margin-bottom:8px;padding:6px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                        <div style="display:flex;align-items:center;gap:4px;color:#d97706;font-size:10px;font-weight:700;">
                            <span class="material-symbols-outlined animate-spin" style="font-size:12px">autorenew</span>
                            AI Modeli Hesaplanıyor...
                        </div>
                    </div>

                    <div style="font-size:11px;color:#555;margin-bottom:2px">🌡 Brightness: <b>${point.brightness.toFixed(1)} K</b></div>
                    <div style="font-size:11px;color:#555;margin-bottom:2px">📍 ${point.lat.toFixed(4)}°N, ${point.lon.toFixed(4)}°E</div>
                    
                    ${point.wind_speed !== null ? `
                        <div style="font-size:10px;color:#007bff;margin-top:6px;border-top:1px solid #eee;padding-top:6px;font-weight:700">💨 Meteoroloji (Anlık)</div>
                        <div style="font-size:11px;color:#444;margin-bottom:2px">Rüzgar: <b>${point.wind_speed.toFixed(1)} m/s</b> (${point.wind_deg}°)</div>
                        <div style="font-size:11px;color:#444;margin-bottom:2px">Nem: <b>%${point.humidity}</b> | <b>${point.description}</b></div>
                    ` : `
                        <div style="font-size:9px;color:#999;margin-top:6px;border-top:1px solid #eee;padding-top:6px;font-style:italic">
                            *Meteoroloji sensörü yalnız yüksek risk/kırmızı kodlu öncelikli yangınlar için aktiftir.
                        </div>
                    `}

                    <div style="font-size:10px;color:#888;margin-top:4px;border-top:1px solid #eee;padding-top:4px">Kaynak: NASA & OWM</div>
                </div>`;

            const handlePopupOpen = async () => {
                const el = document.getElementById(pointId);
                if (!el || el.dataset.loaded) return;
                
                try {
                    const aiResult = await fetchAiPredictionForPoint(point);
                    if (!document.getElementById(pointId)) return; // Kapanmış olabilir
                    
                    const colorMap = { 'Kritik': '#ef4444', 'Yüksek': '#f97316', 'Orta': '#f59e0b', 'Düşük': '#22c55e' };
                    const color = colorMap[aiResult.risk_seviyesi] || '#64748b';
                    
                    el.style.background = '#f8fafc';
                    el.style.borderColor = '#e2e8f0';
                    el.dataset.loaded = 'true';
                    el.innerHTML = `
                        <div style="display:flex;align-items:center;justify-content:space-between">
                            <div>
                                <div style="font-size:8px;text-transform:uppercase;font-weight:800;color:#94a3b8;letter-spacing:0.05em;margin-bottom:1px">Yapay Zeka Tahmini</div>
                                <div style="font-weight:900;font-size:15px;color:${color}">${aiResult.frp_tahmin.toFixed(0)} <span style="font-size:10px;color:#64748b">MW</span></div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:9px;font-weight:800;padding:3px 6px;border-radius:4px;color:white;background:${color};box-shadow:0 1px 2px rgba(0,0,0,0.1)">${aiResult.risk_seviyesi}</div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    if (document.getElementById(pointId)) {
                        el.innerHTML = '<div style="color:#ef4444;font-size:10px;font-weight:600">AI Bağlantı Hatası</div>';
                        el.style.background = '#fee2e2';
                        el.style.borderColor = '#f87171';
                    }
                }
            };

            circle.bindPopup(popupHtml);
            circle.on('popupopen', handlePopupOpen);
            fireGroup.addLayer(circle);

            // 🔥 İkon marker
            const iconMarker = L.marker([point.lat, point.lon], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<span class="material-symbols-outlined ${iconClass[point.color] || 'text-gray-400'} bg-white/90 rounded-full p-1 shadow-lg" style="font-variation-settings:'FILL' 1;font-size:14px">local_fire_department</span>`,
                    iconSize: [24, 24], iconAnchor: [12, 12],
                }),
            });
            iconMarker.bindPopup(popupHtml);
            iconMarker.on('popupopen', handlePopupOpen);
            fireGroup.addLayer(iconMarker);

            // 💨 Rüzgar Vektörü (Ok) — Eğer veri varsa
            if (point.wind_speed !== null) {
                const arrowIcon = L.divIcon({
                    className: 'wind-arrow-marker',
                    html: `<div style="transform: rotate(${point.wind_deg}deg); transition: transform 0.5s ease;">
                        <span class="material-symbols-outlined text-blue-500/80 drop-shadow-md" style="font-size: ${Math.min(32, 16 + (point.wind_speed || 0) * 2)}px; font-weight: 900;">north</span>
                    </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                
                fireGroup.addLayer(L.marker([point.lat, point.lon], { 
                    icon: arrowIcon,
                    interactive: false,
                    zIndexOffset: -100
                }));
            }
        });
    }, [firePoints]);

    /* ─── Katman Toggle ────────────────────────── */
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (layers.fire) {
            if (!map.hasLayer(fireLayerGroupRef.current))   fireLayerGroupRef.current.addTo(map);
            if (!map.hasLayer(bufferLayerGroupRef.current)) bufferLayerGroupRef.current.addTo(map);
        } else {
            if (map.hasLayer(fireLayerGroupRef.current))   fireLayerGroupRef.current.remove();
            if (map.hasLayer(bufferLayerGroupRef.current)) bufferLayerGroupRef.current.remove();
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
