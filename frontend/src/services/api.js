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
