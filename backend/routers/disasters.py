"""
Disasters Router
-----------------
Afet verisi REST endpoint'leri.
Gelecekte /flood, /earthquake, /landslide gibi endpoint'ler de eklenecek.
"""

import logging
from fastapi import APIRouter, HTTPException

from models.disaster_models import FirePoint
from services.fire_service import get_fire_data


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/disasters", tags=["disasters"])


@router.get("/fire", response_model=list[FirePoint])
def get_fires():
    """
    Türkiye'deki aktif yangın noktalarını döndürür.
    Veri kaynağı: NASA FIRMS (VIIRS_NOAA20_NRT)
    Cache: 60 saniye in-memory
    """
    try:
        fire_points = get_fire_data()
        logger.info("Returning %d fire points", len(fire_points))
        return fire_points
    except ValueError as e:
        logger.error("Configuration error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        logger.error("NASA API error: %s", e)
        raise HTTPException(status_code=503, detail="Veri kaynağına ulaşılamıyor. Lütfen daha sonra tekrar deneyin.")
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        raise HTTPException(status_code=500, detail="Beklenmeyen bir hata oluştu.")
