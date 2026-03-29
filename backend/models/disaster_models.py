from typing import Optional
from pydantic import BaseModel


class FirePoint(BaseModel):
    """Tek bir yangın noktasını temsil eder."""
    lat: float
    lon: float
    level: str       # "Küçük Yangın" | "Orta Yangın" | "Büyük Yangın"
    brightness: float
    color: str       # "green" | "yellow" | "red"

    # Meteorolojik Veriler (Optional)
    wind_speed: Optional[float] = None  # m/s
    wind_deg: Optional[int] = None      # derece
    humidity: Optional[int] = None      # yüzde
    description: Optional[str] = None   # "Açık", "Bulutlu" vb.
