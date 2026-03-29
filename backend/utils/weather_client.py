import os
import requests
import logging

logger = logging.getLogger(__name__)

# OpenWeatherMap (OWM) API Configuration
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Türkçe hava durumu açıklamaları haritası (Basitleştirilmiş)
# OWM lang=tr parametresi ile zaten Türkçe dönebilir, o yüzden onu kullanacağız.

def fetch_weather_for_point(lat, lon):
    """
    Belirli bir koordinat için anlık hava durumu verilerini çeker.
    
    Returns:
        dict: {wind_speed, wind_deg, humidity, description} v.b. veya None
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key or "PASTE_YOUR_OPENWEATHER_API_KEY_HERE" in api_key:
        logger.warning("OPENWEATHER_API_KEY is not set or placeholder. Skipping weather fetch.")
        return None

    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric", # m/s (wind) ve Celsius (temp)
        "lang": "tr"       # Türkçe açıklamalar
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "wind_speed": data.get("wind", {}).get("speed"),
                "wind_deg": data.get("wind", {}).get("deg"),
                "humidity": data.get("main", {}).get("humidity"),
                "description": data.get("weather", [{}])[0].get("description", "").capitalize()
            }
        else:
            logger.error(f"OWM API Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Weather fetch failed for ({lat}, {lon}): {e}")
        return None
