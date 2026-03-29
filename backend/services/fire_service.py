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

    # UI Performans Optimizasyonu: Her bölge için Düşük/Orta riskleri 10 ile, yüksek riskleri 250 ile sınırla
    if "region" in df.columns:
        def filter_region(group):
            reds = group[group[brightness_col] >= 360].nlargest(250, brightness_col)
            yellows = group[(group[brightness_col] >= 330) & (group[brightness_col] < 360)].nlargest(10, brightness_col)
            greens = group[group[brightness_col] < 330].nlargest(10, brightness_col)

            # Rüzgar/Hava durumu çekilecek hedefleri eşdeğer, orta ve yüksek risklere bölüyoruz.
            reds = reds.assign(fetch_weather=False)
            yellows = yellows.assign(fetch_weather=False)
            greens = greens.assign(fetch_weather=False)

            if not reds.empty:
                reds.iloc[:min(10, len(reds)), reds.columns.get_loc('fetch_weather')] = True
            if not yellows.empty:
                yellows.iloc[:min(5, len(yellows)), yellows.columns.get_loc('fetch_weather')] = True

            return pd.concat([reds, yellows, greens])
        
        df = df.groupby("region", group_keys=False).apply(filter_region).reset_index(drop=True)

    import concurrent.futures
    results: list[FirePoint] = []
    
    # Hava durumu verisi çekilecek noktaları tutalım
    weather_tasks = []

    for _, row in df.iterrows():
        lat = row.get("latitude")
        lon = row.get("longitude")
        brightness = row.get(brightness_col)
        should_fetch_weather = row.get("fetch_weather", False)

        if pd.isna(lat) or pd.isna(lon):
            continue

        # Koordinat tip doğrulaması
        try:
            lat_f = float(lat)
            lon_f = float(lon)
        except (ValueError, TypeError):
            continue

        # Bölge bazlı bounding box doğrulaması
        def is_in_supported_region(lt, ln):
            # Türkiye (Genişletilmiş)
            if (35 <= lt <= 43 and 25 <= ln <= 46): return True
            # Hindistan
            if (6 <= lt <= 38 and 68 <= ln <= 98): return True
            return False

        if not is_in_supported_region(lat_f, lon_f):
            continue

        color, level = _classify_fire(brightness)

        point = FirePoint(
            lat=lat_f,
            lon=lon_f,
            level=level,
            brightness=float(brightness) if not pd.isna(brightness) else 0.0,
            color=color,
            wind_speed=None, wind_deg=None, humidity=None, description=None
        )
        results.append(point)
        
        # Sadece eşdeğer dağıtılmış hedefleri sıraya al
        if should_fetch_weather:
            weather_tasks.append((len(results) - 1, lat_f, lon_f))

    # Paralel Hava Durumu API İstekleri (Multi-threading ile sıfır bekleme)
    if weather_tasks:
        def solve_weather(idx, lt, ln):
            return idx, fetch_weather_for_point(lt, ln)
            
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(20, len(weather_tasks))) as executor:
            futures = [executor.submit(solve_weather, task[0], task[1], task[2]) for task in weather_tasks]
            for future in concurrent.futures.as_completed(futures):
                idx, weather_data = future.result()
                if weather_data:
                    results[idx].wind_speed = weather_data.get("wind_speed")
                    results[idx].wind_deg = weather_data.get("wind_deg")
                    results[idx].humidity = weather_data.get("humidity")
                    results[idx].description = weather_data.get("description")

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
