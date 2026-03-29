/**
 * routing.js — BKZS Tehlike Farkında Çok Rota Motoru v3
 * -------------------------------------------------------
 * Yeni: getAllRoutes() → Güvenli rota + OSRM alternatifleri
 * Strateji: Çift Waypoint Bracket (giriş/çıkış) — değişmedi
 */

import L from 'leaflet';

/* ─── Geocoding ─────────────────────────────────────────────── */
export async function geocode(placeName) {
    // Sadece Türkiye'de arama yap
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&countrycodes=tr&limit=1`;
    try {
        const res = await fetch(url, { headers: { 'Accept-Language': 'tr' } });
        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
        const data = await res.json();
        if (!data.length) return null;
        
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const name = data[0].display_name.split(',')[0];
        
        // Bounding Box (Sınır Kutusu) Testi (Yaklaşık TR sınırları)
        if (lat < 35.8 || lat > 42.2 || lng < 25.6 || lng > 44.8) {
            throw new Error(`"${name}" Türkiye sınırları dışında! Lütfen yurtiçi bir konum girin.`);
        }

        return { lat, lng, name };
    } catch (err) {
        // Özel Bounding Box fırlatmasını doğrudan ilet
        if (err.message.includes('sınırları dışında')) throw err;
        throw new Error(`Konum arama hizmetine ulaşılamadı. İnternet bağlantınızı kontrol edin.`);
    }
}

/* ─── OSRM Helpers ──────────────────────────────────────────── */
async function fetchOSRM(coordsStr) {
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    return data.routes[0];
}

/** OSRM'den max `maxAlts` alternatif rota döndürür */
async function fetchOSRMAlternatives(coordsStr, maxAlts = 2) {
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=${maxAlts}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return [];
    return data.routes;
}

export async function getRoute(from, to) {
    return fetchOSRM(`${from.lng},${from.lat};${to.lng},${to.lat}`);
}

/* ─── Threat Detection ──────────────────────────────────────── */
function findThreatsAlongRoute(routeCoords, firePoints) {
    const threats = [];

    firePoints.forEach(fp => {
        const dangerRadius = fp.color === 'red'    ? 28000
                           : fp.color === 'yellow' ? 20000
                           :                         12000;

        const fpLL = L.latLng(fp.lat, fp.lon);
        let minDist = Infinity;
        let closestIdx = 0;

        routeCoords.forEach((coord, idx) => {
            const dist = fpLL.distanceTo(L.latLng(coord[1], coord[0]));
            if (dist < minDist) { minDist = dist; closestIdx = idx; }
        });

        if (minDist < dangerRadius * 1.5) {
            threats.push({
                ...fp, minDist, closestIdx, dangerRadius,
                routeProgress: closestIdx / routeCoords.length,
            });
        }
    });

    const unique = [];
    threats.sort((a, b) => a.routeProgress - b.routeProgress);
    threats.forEach(t => {
        const dup = unique.find(u =>
            L.latLng(u.lat, u.lon).distanceTo(L.latLng(t.lat, t.lon)) < 20000
        );
        if (!dup) unique.push(t);
    });

    return unique;
}

/* ─── Bracket Waypoint Generation ──────────────────────────── */
function generateBracketWaypoints(from, to, threat, allThreats) {
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    const len  = Math.sqrt(dLat * dLat + dLng * dLng);

    // Başlangıç ve bitiş noktası çakışıyorsa bypass üretilemez
    if (len < 0.0001) return [];

    const normLat = dLat / len;
    const normLng = dLng / len;
    const perpLat = -normLng;
    const perpLng =  normLat;

    const sideDeg  = (threat.dangerRadius + 22000) / 111000;
    const alongDeg = (threat.dangerRadius + 10000) / 111000;

    const entryLat = threat.lat - normLat * alongDeg;
    const entryLng = threat.lon - normLng * alongDeg;
    const exitLat  = threat.lat + normLat * alongDeg;
    const exitLng  = threat.lon + normLng * alongDeg;

    const sideA = [
        { lat: entryLat + perpLat * sideDeg, lng: entryLng + perpLng * sideDeg },
        { lat: exitLat  + perpLat * sideDeg, lng: exitLng  + perpLng * sideDeg },
    ];
    const sideB = [
        { lat: entryLat - perpLat * sideDeg, lng: entryLng - perpLng * sideDeg },
        { lat: exitLat  - perpLat * sideDeg, lng: exitLng  - perpLng * sideDeg },
    ];

    let scoreA = 0, scoreB = 0;
    allThreats.forEach(t => {
        const r = t.dangerRadius * 2.0;
        sideA.forEach(wp => { if (L.latLng(wp.lat, wp.lng).distanceTo(L.latLng(t.lat, t.lon)) < r) scoreA++; });
        sideB.forEach(wp => { if (L.latLng(wp.lat, wp.lng).distanceTo(L.latLng(t.lat, t.lon)) < r) scoreB++; });
    });

    const chosen = scoreA <= scoreB ? sideA : sideB;
    return [
        { ...chosen[0], routeProgress: threat.routeProgress - 0.03 },
        { ...chosen[1], routeProgress: threat.routeProgress + 0.03 },
    ];
}

/* ─── Hazard-Aware Route (tek güvenli rota) ─────────────────── */
export async function getHazardAwareRoute(from, to, firePoints = []) {
    const directRoute = await getRoute(from, to);
    if (!directRoute) return { directRoute: null, safeRoute: null, threats: [], bypassed: 0 };

    if (firePoints.length === 0) {
        return { directRoute, safeRoute: directRoute, threats: [], bypassed: 0 };
    }

    const routeCoords = directRoute.geometry.coordinates;
    const threats     = findThreatsAlongRoute(routeCoords, firePoints);

    if (threats.length === 0) {
        return { directRoute, safeRoute: directRoute, threats: [], bypassed: 0 };
    }

    const critical = threats.filter(t => t.color === 'red' || t.color === 'yellow').slice(0, 3);
    if (critical.length === 0) {
        return { directRoute, safeRoute: directRoute, threats, bypassed: 0 };
    }

    const allWaypoints = [];
    critical.forEach(t => {
        const bracket = generateBracketWaypoints(from, to, t, threats);
        allWaypoints.push(...bracket);
    });
    allWaypoints.sort((a, b) => a.routeProgress - b.routeProgress);

    const allPoints = [from, ...allWaypoints, to];
    const coordsStr = allPoints.map(p => `${p.lng},${p.lat}`).join(';');

    try {
        const safeRoute = await fetchOSRM(coordsStr);
        if (!safeRoute) return { directRoute, safeRoute: directRoute, threats, bypassed: 0 };

        const safeThreats = findThreatsAlongRoute(
            safeRoute.geometry.coordinates,
            firePoints.filter(fp => fp.color === 'red' || fp.color === 'yellow')
        );
        const bypassed = Math.max(0, critical.length - safeThreats.length);

        return { directRoute, safeRoute, threats, bypassed, remainingThreats: safeThreats.length };
    } catch {
        return { directRoute, safeRoute: directRoute, threats, bypassed: 0 };
    }
}

/* ─── Safety Score ────────────────────────────────── */
export function calculateSafety(routeCoords, liveFirePoints = []) {
    if (!liveFirePoints?.length) return 97;
    if (!routeCoords?.length)    return 97;  // NaN guard: koordinat yoksa güvenli say

    let weightedDanger = 0;
    let maxDangerLevelHit = 0; // 0: Hiçbiri, 1: Yeşil, 2: Sarı, 3: Kırmızı
    const totalPoints  = routeCoords.length;

    routeCoords.forEach(coord => {
        liveFirePoints.forEach(fp => {
            const dist   = L.latLng(coord[1], coord[0]).distanceTo(L.latLng(fp.lat, fp.lon));
            const radius = fp.color === 'red' ? 28000 : fp.color === 'yellow' ? 20000 : 12000;
            
            if (dist < radius) {
                const weight = fp.color === 'red' ? 3 : fp.color === 'yellow' ? 2 : 1;
                weightedDanger += weight * (1 - dist / radius);
                
                // Rotanın girdiği en şiddetli tehlike çemberini işaretle
                if (fp.color === 'red') maxDangerLevelHit = 3;
                else if (fp.color === 'yellow' && maxDangerLevelHit < 2) maxDangerLevelHit = 2;
                else if (fp.color === 'green' && maxDangerLevelHit < 1) maxDangerLevelHit = 1;
            }
        });
    });

    // totalPoints veya liveFirePoints.length sıfır olamaz (yukarıda guard'landı)
    const dangerRatio = weightedDanger / (totalPoints * liveFirePoints.length * 3);
    
    // Normal puan (eski oranla biraz daha agresif)
    let score = Math.round(100 - dangerRatio * 500);
    
    // Ağır Risk Tavan (Kırmızıya girerse %35'i geçemez, Sarıya girerse %65'i geçemez)
    if (maxDangerLevelHit === 3) score = Math.min(score, 35);
    else if (maxDangerLevelHit === 2) score = Math.min(score, 65);
    else if (maxDangerLevelHit === 1) score = Math.min(score, 85);
    else if (score < 97 && maxDangerLevelHit === 0) score = 97; // Tehlikeye hiç girmediyse

    // NaN veya Infinity koruması
    if (!isFinite(score)) return 97;
    return Math.max(10, Math.min(100, score));
}

/* ─── Ana Fonksiyon: Tüm Alternatifleri Hesapla ─────────────── */
/**
 * Güvenli rota + OSRM alternatifleri dahil tüm seçenekleri döndürür.
 *
 * @returns {{
 *   routes: RouteOption[],  Sıralı rota seçenekleri
 *   threats: Threat[],      Doğrudan rota boyunca tehditler
 * }}
 *
 * RouteOption: {
 *   id, label, type, color, icon, badge,
 *   route (OSRM obj), distanceKm, durationMin, safetyScore,
 *   bypassed, remainingThreats
 * }
 */
export async function getAllRoutes(from, to, firePoints = []) {
    const coordsStr = `${from.lng},${from.lat};${to.lng},${to.lat}`;

    // Paralel: güvenli rota + OSRM alternatifleri aynı anda
    const [hazardResult, osrmAlternatives] = await Promise.all([
        getHazardAwareRoute(from, to, firePoints),
        fetchOSRMAlternatives(coordsStr, 2),
    ]);

    const { directRoute, safeRoute, threats, bypassed = 0, remainingThreats = 0 } = hazardResult;
    if (!directRoute) return { routes: [], threats: [] };

    // Rota tanımları — null route olanları filtrele
    const routeDefinitions = [
        {
            id: 'safe',
            label: 'Güvenli Rota',
            type: 'safe',
            color: '#3fff8b',
            icon: 'shield',
            badge: bypassed > 0 ? 'ÖNERİLEN' : null,
            route: safeRoute,
            bypassed,
            remainingThreats,
        },
        ...osrmAlternatives.slice(0, 3).map((r, i) => ({
            id: `osrm_${i}`,
            label: i === 0 ? 'Doğrudan Rota' : `Alternatif ${i}`,
            type: i === 0 ? 'direct' : 'alternative',
            color: ['#94a3b8', '#60a5fa', '#f472b6'][i],
            icon: i === 0 ? 'route' : 'alt_route',
            badge: bypassed === 0 && i === 0 ? 'ÖNERİLEN' : null,
            route: r,
            bypassed: 0,
            remainingThreats: 0,
        })),
    ].filter(def => def.route?.geometry?.coordinates?.length > 0);  // null / geçersiz rotaları çıkar

    if (!routeDefinitions.length) return { routes: [], threats };

    // Güvenlik skorlarını hesapla
    const routes = routeDefinitions.map(def => ({
        ...def,
        distanceKm:  (def.route.distance / 1000).toFixed(1),
        durationMin: Math.round(def.route.duration / 60),
        safetyScore: calculateSafety(def.route.geometry.coordinates, firePoints),
    }));

    return { routes, threats };
}
