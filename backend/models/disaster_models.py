from pydantic import BaseModel


class FirePoint(BaseModel):
    """Tek bir yangın noktasını temsil eder."""
    lat: float
    lon: float
    level: str       # "Küçük Yangın" | "Orta Yangın" | "Büyük Yangın"
    brightness: float
    color: str       # "green" | "yellow" | "red"
