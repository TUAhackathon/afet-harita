import requests
import logging

logger = logging.getLogger(__name__)

# Open-Meteo: Tamamen ücretsiz ve API anahtarı istemeyen alternatif servis
BASE_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Meteoroloji kodlarının Türkçe karşılıkları
WMO_CODES = {
    0: "Açık", 1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu", 3: "Çok Bulutlu",
    45: "Sisli", 48: "Kırağılı Sisli",
    51: "Hafif Çisenti", 53: "Orta Çisenti", 55: "Yoğun Çisenti",
    61: "Hafif Yağmurlu", 63: "Yağmurlu", 65: "Şiddetli Yağmurlu",
    71: "Hafif Kar", 73: "Karlı", 75: "Yoğun Kar",
    80: "Hafif Sağanak", 81: "Sağanak", 82: "Şiddetli Sağanak",
    95: "Fırtına", 96: "Kuvvetli Fırtına", 99: "Şiddetli Fırtına"
}

def fetch_weather_for_point(lat, lon):
    """
    Belirli bir koordinat için anlık hava durumu verilerini Open-Meteo'dan çeker.
    API KEY gerektirmez.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode",
        "wind_speed_unit": "ms"  # Metre/Saniye cinsinden okumak için
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            current = data.get("current", {})
            wmo = current.get("weathercode", 0)
            return {
                "wind_speed": current.get("wind_speed_10m"),
                "wind_deg": current.get("wind_direction_10m"),
                "humidity": current.get("relative_humidity_2m"),
                "description": WMO_CODES.get(wmo, "Yağışsız")
            }
        else:
            logger.error(f"Open-Meteo Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Open-Meteo fetch failed for ({lat}, {lon}): {e}")
        return None
