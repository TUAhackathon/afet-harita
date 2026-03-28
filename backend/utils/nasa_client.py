"""
NASA FIRMS API Client
---------------------
Türkiye bounding box'ı içerisindeki yangın verilerini
NASA FIRMS (VIIRS_NOAA20_NRT) API'sinden çeker.
"""

import os
import requests
import pandas as pd
from io import StringIO


# Türkiye bounding box
MIN_LAT = 36
MAX_LAT = 42
MIN_LON = 26
MAX_LON = 45

DATASET = "VIIRS_NOAA20_NRT"
BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


def fetch_fire_data() -> pd.DataFrame:
    """
    NASA FIRMS API'den Türkiye yangın verilerini çeker.
    
    Returns:
        pd.DataFrame: Yangın verileri (latitude, longitude, brightness vb.)
    
    Raises:
        RuntimeError: API çağrısı başarısız olursa
        ValueError: API anahtarı tanımlı değilse
    """
    api_key = os.getenv("FIRMS_API_KEY")
    if not api_key:
        raise ValueError("FIRMS_API_KEY environment variable is not set.")

    url = f"{BASE_URL}/{api_key}/{DATASET}/{MIN_LON},{MIN_LAT},{MAX_LON},{MAX_LAT}/1"

    response = requests.get(url, timeout=30)

    if response.status_code != 200:
        raise RuntimeError(
            f"NASA FIRMS API error: HTTP {response.status_code} — {response.text[:200]}"
        )

    text = response.text.strip()
    if not text or "," not in text:
        # API boş veya geçersiz yanıt döndürdü
        return pd.DataFrame()

    df = pd.read_csv(StringIO(text))
    return df
