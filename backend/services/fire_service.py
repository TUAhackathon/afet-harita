"""
Fire Service
-------------
NASA FIRMS verisini işler, yangın seviyesini sınıflandırır ve
60 saniyelik in-memory cache mekanizması uygular.
"""

import time
import logging
from typing import Optional

import pandas as pd

from models.disaster_models import FirePoint
from utils.nasa_client import fetch_fire_data


logger = logging.getLogger(__name__)

# ── In-Memory Cache ──────────────────────────────────────────
_cache: Optional[list[FirePoint]] = None
_cache_timestamp: float = 0.0
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
    """
    if df.empty:
        return []

    brightness_col = _find_brightness_column(df)
    if brightness_col is None:
        logger.warning("Brightness column not found in FIRMS data. Columns: %s", list(df.columns))
        return []

    results: list[FirePoint] = []

    for _, row in df.iterrows():
        lat = row.get("latitude")
        lon = row.get("longitude")
        brightness = row.get(brightness_col)

        if pd.isna(lat) or pd.isna(lon):
            continue

        color, level = _classify_fire(brightness)

        results.append(FirePoint(
            lat=float(lat),
            lon=float(lon),
            level=level,
            brightness=float(brightness) if not pd.isna(brightness) else 0.0,
            color=color,
        ))

    return results


def get_fire_data() -> list[FirePoint]:
    """
    Yangın verilerini döndürür. 60 saniyelik cache mekanizması uygular.
    Cache süresi dolmuşsa NASA API'den yeni veri çeker.
    
    Returns:
        list[FirePoint]: İşlenmiş yangın noktaları
        
    Raises:
        RuntimeError: NASA API çağrısı başarısız olursa
    """
    global _cache, _cache_timestamp

    now = time.time()

    # Cache geçerliyse mevcut veriyi döndür
    if _cache is not None and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
        logger.info("Cache hit — returning %d fire points", len(_cache))
        return _cache

    # Cache miss — API'den yeni veri çek
    logger.info("Cache miss — fetching fresh data from NASA FIRMS")
    df = fetch_fire_data()
    fire_points = _process_fire_data(df)

    # Cache'i güncelle
    _cache = fire_points
    _cache_timestamp = now

    logger.info("Fetched and cached %d fire points", len(fire_points))
    return fire_points
