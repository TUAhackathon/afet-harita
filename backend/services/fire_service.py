"""
Fire Service
-------------
NASA FIRMS verisini işler, yangın seviyesini sınıflandırır ve
60 saniyelik in-memory cache mekanizması uygular.
Thread-safe: threading.Lock kullanır.
"""

import time
import logging
import threading
from typing import Optional

import pandas as pd

from models.disaster_models import FirePoint
from utils.nasa_client import fetch_fire_data
from utils.weather_client import fetch_weather_for_point


logger = logging.getLogger(__name__)

# ── In-Memory Cache ──────────────────────────────────────────
_cache: Optional[list[FirePoint]] = None
_cache_timestamp: float = 0.0
_cache_lock = threading.Lock()
CACHE_TTL_SECONDS = 60


def _classify_fire(brightness: float) -> tuple[str, str]:
    """
    Brightness değerine göre yangın seviyesini sınıflandırır.

    Returns:
        (color, level) tuple
    """
    if pd.isna(brightness):
        return ("gray", "Bilinmiyor")
    elif brightness < 330:
        return ("green", "Küçük Yangın")
    elif brightness < 360:
        return ("yellow", "Orta Yangın")
    else:
        return ("red", "Büyük Yangın")


def _find_brightness_column(df: pd.DataFrame) -> Optional[str]:
    """DataFrame'deki brightness kolonunu bulur."""
    if "brightness" in df.columns:
        return "brightness"
    elif "bright_ti4" in df.columns:
        return "bright_ti4"
    return None


def _process_fire_data(df: pd.DataFrame) -> list[FirePoint]:
    """
    Ham DataFrame'i FirePoint listesine dönüştürür.
    Koordinat aralığı (Türkiye bounding box) ve tip doğrulaması içerir.
    """
    if df.empty:
        return []

    brightness_col = _find_brightness_column(df)
    if brightness_col is None:
        logger.warning("Brightness column not found in FIRMS data. Columns: %s", list(df.columns))
        return []

    results: list[FirePoint] = []
    
    # Hava durumu verisi çekilecek maksimum nokta sayısı (API limitlerini korumak için)
    MAX_WEATHER_POINTS = 20
    weather_count = 0

    for _, row in df.iterrows():
        lat = row.get("latitude")
        lon = row.get("longitude")
        brightness = row.get(brightness_col)

        if pd.isna(lat) or pd.isna(lon):
            continue

        # Koordinat tip doğrulaması
        try:
            lat_f = float(lat)
            lon_f = float(lon)
        except (ValueError, TypeError):
            continue

        # Türkiye yakın bölge bounding box doğrulaması
        if not (30 <= lat_f <= 45 and 24 <= lon_f <= 47):
            continue

        color, level = _classify_fire(brightness)

        # Hava durumu verisi ekle (Eğer limit dolmadıysa)
        weather_data = None
        if weather_count < MAX_WEATHER_POINTS:
            weather_data = fetch_weather_for_point(lat, lon)
            if weather_data:
                weather_count += 1

        results.append(FirePoint(
            lat=lat_f,
            lon=lon_f,
            level=level,
            brightness=float(brightness) if not pd.isna(brightness) else 0.0,
            color=color,
            # Meteoroloji
            wind_speed=weather_data["wind_speed"] if weather_data else None,
            wind_deg=weather_data["wind_deg"] if weather_data else None,
            humidity=weather_data["humidity"] if weather_data else None,
            description=weather_data["description"] if weather_data else None
        ))

    return results


def get_fire_data() -> list[FirePoint]:
    """
    Yangın verilerini döndürür. 60 saniyelik cache mekanizması uygular.
    Cache süresi dolmuşsa NASA API'den yeni veri çeker.
    Thread-safe double-check locking pattern kullanır.

    Returns:
        list[FirePoint]: İşlenmiş yangın noktaları

    Raises:
        RuntimeError: NASA API çağrısı başarısız olursa ve cache boşsa
    """
    global _cache, _cache_timestamp

    now = time.time()

    # Fast path: cache geçerliyse lock almadan döndür
    if _cache is not None and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
        logger.info("Cache hit — returning %d fire points", len(_cache))
        return _cache

    with _cache_lock:
        # Double-check locking: başka thread cache'i güncellemiş olabilir
        now = time.time()
        if _cache is not None and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
            logger.info("Cache hit (post-lock) — returning %d fire points", len(_cache))
            return _cache

        # Cache miss — API'den yeni veri çek
        logger.info("Cache miss — fetching fresh data from NASA FIRMS")
        try:
            df = fetch_fire_data()
        except Exception as e:
            # API hatası varsa eski (stale) cache'i döndür — tamamen boş dönmekten iyidir
            if _cache is not None:
                logger.warning("NASA API failed (%s), returning stale cache (%d points)", e, len(_cache))
                return _cache
            raise  # Cache boşsa hatayı yukarı ilet

        fire_points = _process_fire_data(df)

        # Cache'i güncelle
        _cache = fire_points
        _cache_timestamp = now

        logger.info("Fetched and cached %d fire points", len(fire_points))
        return fire_points
