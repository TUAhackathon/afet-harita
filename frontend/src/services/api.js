/**
 * api.js
 * -------
 * Afet Harita backend API istek katmanı.
 * Tüm fetch çağrıları bu modülden yapılır; base URL yönetimi merkezileştirilir.
 * Vite proxy: /api → http://localhost:8000/api
 */

const API_BASE = '/api';

/**
 * Türkiye'deki aktif yangın noktalarını döndürür.
 * Kaynak: NASA FIRMS (VIIRS_NOAA20_NRT) — backend 60s cache ile sunar.
 *
 * @returns {Promise<Array<{lat, lon, level, brightness, color}>>}
 */
export async function fetchFirePoints() {
    const res = await fetch(`${API_BASE}/disasters/fire`);
    if (!res.ok) {
        throw new Error(`Yangın verisi alınamadı: HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Backend sağlık kontrolü.
 * @returns {Promise<{status: string}>}
 */
export async function checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend erişilemiyor');
    return res.json();
}

/**
 * Mevcut yangın noktalarını AI modeline gönderir, FRP ve risk tahmini döndürür.
 * Sadece kırmızı ve sarı (yüksek riskli) noktaları analiz eder; max 20 nokta ile sınırlı.
 *
 * @param {Array<{lat, lon, brightness, color}>} firePoints - NASA FIRMS yangın noktaları
 * @returns {Promise<Array>} - AI tahmin sonuçları (frp_tahmin, risk_seviyesi, risk_renk, lat, lon)
 */
export async function runAiRiskAnalysis(firePoints) {
    // Sadece riskli noktaları seç, brightness'a göre sırala, max 20 noktayla sınırla
    const targets = firePoints
        .filter(p => p.color === 'red' || p.color === 'yellow')
        .sort((a, b) => b.brightness - a.brightness)
        .slice(0, 20);

    if (targets.length === 0) {
        return [];
    }

    const today = new Date().toISOString().split('T')[0];
    const hhmm = new Date().getHours() * 100 + new Date().getMinutes();

    // Paralel API istekleri (Promise.allSettled — biri başarısız olursa diğerleri etkilenmez)
    const promises = targets.map(point =>
        fetch(`${API_BASE}/ai/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude:   point.lat,
                longitude:  point.lon,
                brightness: point.brightness,
                bright_t31: Math.max(200, point.brightness - 45), // FIRMS'te bu alan yok, makul fallback
                scan:       1.0,
                track:      1.0,
                confidence: point.color === 'red' ? 'high' : 'nominal',
                daynight:   new Date().getHours() >= 6 && new Date().getHours() < 20 ? 'D' : 'N',
                acq_date:   today,
                acq_time:   hhmm,
            }),
        })
        .then(async res => {
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, lat: point.lat, lon: point.lon, color: point.color };
        })
        .catch(() => null)
    );

    const settled = await Promise.allSettled(promises);
    return settled
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)
        .sort((a, b) => b.frp_tahmin - a.frp_tahmin); // En yüksek FRP üste
}
