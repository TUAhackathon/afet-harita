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


import os
import requests
import pandas as pd
from io import StringIO
import logging

logger = logging.getLogger(__name__)

# Bölge bazlı koordinat tanımları (West, South, East, North)
REGIONS = {
    "Turkey": {
        "min_lon": 26, "min_lat": 36,
        "max_lon": 45, "max_lat": 42
    },
    "India": {
        "min_lon": 68, "min_lat": 6,
        "max_lon": 98, "max_lat": 38
    }
}

DATASET = "VIIRS_NOAA20_NRT"
BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


def fetch_fire_data() -> pd.DataFrame:
    """
    NASA FIRMS API'den yapılandırılmış tüm bölgeler için yangın verilerini çeker.
    
    Returns:
        pd.DataFrame: Birleştirilmiş yangın verileri (latitude, longitude, brightness vb.)
    """
    api_key = os.getenv("FIRMS_API_KEY")
    if not api_key:
        raise ValueError("FIRMS_API_KEY environment variable is not set.")

    import concurrent.futures

    all_dfs = []

    def fetch_region(region_name, coords):
        area_str = f"{coords['min_lon']},{coords['min_lat']},{coords['max_lon']},{coords['max_lat']}"
        url = f"{BASE_URL}/{api_key}/{DATASET}/{area_str}/2"

        logger.info("Fetching NASA FIRMS data for region: %s", region_name)
        try:
            response = requests.get(url, timeout=30)
            if response.status_code != 200:
                logger.error("Failed to fetch data for %s: HTTP %s", region_name, response.status_code)
                return None

            text = response.text.strip()
            if not text or "," not in text:
                logger.info("No fire data for region: %s", region_name)
                return None

            df = pd.read_csv(StringIO(text))
            if not df.empty:
                df["region"] = region_name
                return df
        except Exception as e:
            logger.error("Exception fetching data for %s: %s", region_name, e)
        return None

    # Paralel işlem (Multi-threading) - Hem TR hem Hindistan aynı anda çekilecek
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(REGIONS)) as executor:
        futures = {executor.submit(fetch_region, name, coords): name for name, coords in REGIONS.items()}
        for future in concurrent.futures.as_completed(futures):
            res_df = future.result()
            if res_df is not None and not res_df.empty:
                all_dfs.append(res_df)

    if not all_dfs:
        return pd.DataFrame()

    return pd.concat(all_dfs, ignore_index=True)
