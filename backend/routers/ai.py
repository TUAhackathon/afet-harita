import os
import math
import joblib
import logging
from datetime import date, datetime
from typing import Literal
import numpy as np

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# ── Dizin yolları ─────────────────────────────────────────────────────────────
# backend/routers/ai.py konumunda olduğumuz için BASE_DIR backend dizinidir.
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR   = os.path.join(BASE_DIR, "model")

logger = logging.getLogger(__name__)

# ── Model ve lookup tablolarını yükle ─────────────────────────────────────────
try:
    lgb_model      = joblib.load(os.path.join(MODEL_DIR, "lgb_model.pkl"))
    lookup         = joblib.load(os.path.join(MODEL_DIR, "lookup.pkl"))
    MODEL_FEATURES = joblib.load(os.path.join(MODEL_DIR, "features.pkl"))
    MODEL_LOADED   = True
    logger.info("[AI MODEL] Model basariyla yuklendi.")
except Exception as e:
    logger.warning(f"[AI MODEL] Model yüklenemedi (Dosyalar backend/model/ icinde eksik olabilir): {e}")
    lgb_model = lookup = MODEL_FEATURES = None
    MODEL_LOADED = False

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Tahmin"]
)

# ── Pydantic şemaları ─────────────────────────────────────────────────────────
class FireInput(BaseModel):
    latitude:    float = Field(..., ge=-90,  le=90,  example=39.5,  description="Enlem (°)")
    longitude:   float = Field(..., ge=-180, le=180, example=33.2,  description="Boylam (°)")
    brightness:  float = Field(..., ge=200,  le=600, example=340.0, description="Parlaklık sıcaklığı (K)")
    bright_t31:  float = Field(..., ge=200,  le=400, example=295.0, description="Band-31 parlaklık sıcaklığı (K)")
    scan:        float = Field(1.0, ge=0.1,  le=5.0, example=1.0,   description="Tarama piksel boyutu (km)")
    track:       float = Field(1.0, ge=0.1,  le=5.0, example=1.0,   description="İz piksel boyutu (km)")
    confidence:  Literal["low", "nominal", "high"] = Field("high", example="high", description="Güven düzeyi")
    daynight:    Literal["D", "N"] = Field("D", example="D", description="Gündüz/Gece")
    acq_date:    date  = Field(..., example="2023-07-15", description="Algılama tarihi (YYYY-MM-DD)")
    acq_time:    int   = Field(1200, ge=0, le=2359, example=1200, description="Algılama saati (HHMM)")


class FireOutput(BaseModel):
    frp_tahmin:     float = Field(..., description="Tahmin edilen FRP (MW)")
    frp_log_tahmin: float = Field(..., description="Tahmin edilen FRP_LOG değeri")
    risk_seviyesi:  str   = Field(..., description="Yangın risk seviyesi")
    risk_renk:      str   = Field(..., description="Risk rengi (hex)")
    grid_id:        str   = Field(..., description="Izgara hücresi ID")
    grid_frp_medyan: float = Field(..., description="Bu ızgara hücresinin medyan FRP'si (MW)")
    mesaj:          str   = Field(..., description="Açıklama mesajı")


# ── Yardımcı: özellik vektörü oluştur ────────────────────────────────────────
def build_features(inp: FireInput) -> list:
    dt   = datetime.combine(inp.acq_date, datetime.min.time())
    yil  = inp.acq_date.year
    ay   = inp.acq_date.month
    gun  = inp.acq_date.day
    yilin_gunu = dt.timetuple().tm_yday
    hafta       = dt.isocalendar()[1]
    saat_raw    = inp.acq_time
    saat        = (saat_raw // 100) + (saat_raw % 100) / 60.0

    yil_min     = lookup.get("yil_min", 2012)
    yil_relatif = yil - yil_min

    mevsim_map = {12: 1, 1: 1, 2: 1, 3: 2, 4: 2, 5: 2,
                  6: 3, 7: 3, 8: 3, 9: 4, 10: 4, 11: 4}
    mevsim = mevsim_map[ay]

    ay_sin   = math.sin(2 * math.pi * ay   / 12)
    ay_cos   = math.cos(2 * math.pi * ay   / 12)
    gun_sin  = math.sin(2 * math.pi * yilin_gunu / 365)
    gun_cos  = math.cos(2 * math.pi * yilin_gunu / 365)
    saat_sin = math.sin(2 * math.pi * saat / 24)
    saat_cos = math.cos(2 * math.pi * saat / 24)

    lat_bin = round(inp.latitude  / 0.5) * 0.5
    lon_bin = round(inp.longitude / 0.5) * 0.5
    grid_id = f"{lat_bin}_{lon_bin}"

    grid_frp_med   = lookup.get("grid_frp_med",  {})
    global_ay_med  = lookup.get("global_ay_med", {})
    yil_ay_med     = lookup.get("yil_ay_med",    {})
    global_frp_med = lookup.get("global_frp_med", 20.0)
    yil_toplam     = lookup.get("yil_toplam",    {})
    grid_count     = lookup.get("grid_count",    {})

    grid_frp_medyan   = grid_frp_med.get(grid_id, global_frp_med)
    ya_key            = f"{yil}_{ay}"
    frp_yil_ay_medyan = yil_ay_med.get(ya_key,
                        global_ay_med.get(ay, global_frp_med))
    yil_toplam_yangin = yil_toplam.get(yil,
                        int(np.median(list(yil_toplam.values()))) if yil_toplam else 0)
    grid_yangin_sayisi = grid_count.get(grid_id, 0)

    temp_diff  = inp.brightness - inp.bright_t31
    temp_ratio = inp.brightness / (inp.bright_t31 + 1e-9)
    pixel_alan = inp.scan * inp.track

    brightness_log        = math.log1p(inp.brightness)
    brightness_saturated  = 1 if inp.brightness >= 367.0 else 0

    conf_enc = {"low": 0, "nominal": 1, "high": 2}[inp.confidence]
    dn_enc   = 1 if inp.daynight == "D" else 0

    feature_map = {
        "YIL": yil, "AY": ay, "GUN": gun, "YILIN_GUNU": yilin_gunu,
        "HAFTA": hafta, "SAAT": saat, "YIL_RELATIF": yil_relatif, "MEVSIM": mevsim,
        "AY_SIN": ay_sin, "AY_COS": ay_cos,
        "GUN_SIN": gun_sin, "GUN_COS": gun_cos,
        "SAAT_SIN": saat_sin, "SAAT_COS": saat_cos,
        "LATITUDE": inp.latitude, "LONGITUDE": inp.longitude,
        "LAT_BIN": lat_bin, "LON_BIN": lon_bin,
        "GRID_YANGIN_SAYISI": grid_yangin_sayisi,
        "GRID_FRP_MEDYAN": grid_frp_medyan,
        "BRIGHTNESS": inp.brightness, "BRIGHT_T31": inp.bright_t31,
        "SCAN": inp.scan, "TRACK": inp.track,
        "TEMP_DIFF": temp_diff, "TEMP_RATIO": temp_ratio, "PIXEL_ALAN": pixel_alan,
        "BRIGHTNESS_LOG": brightness_log, "BRIGHTNESS_SATURATED": brightness_saturated,
        "CONFIDENCE_ENC": conf_enc, "DAYNIGHT_ENC": dn_enc,
        "FRP_YIL_AY_MEDYAN": frp_yil_ay_medyan,
        "YIL_TOPLAM_YANGIN": yil_toplam_yangin,
    }

    return [feature_map[f] for f in MODEL_FEATURES], grid_id, grid_frp_medyan


def risk_siniflandir(frp: float):
    if frp < 10:
        return "Düşük",   "#22c55e"
    elif frp < 50:
        return "Orta",    "#f59e0b"
    elif frp < 200:
        return "Yüksek",  "#f97316"
    else:
        return "Kritik",  "#ef4444"


# ── Endpointler ───────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {
        "durum": "aktif",
        "model_yuklendi": MODEL_LOADED,
        "ozellik_sayisi": len(MODEL_FEATURES) if MODEL_FEATURES else 0,
        "zaman": datetime.utcnow().isoformat(),
    }


@router.post("/predict", response_model=FireOutput)
def predict(inp: FireInput):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model henüz yüklenmedi. '.pkl' dosyalarının 'backend/model' dizininde olduğundan emin olun.")

    vec, grid_id, grid_frp_medyan = build_features(inp)
    frp_log_pred = float(lgb_model.predict([vec])[0])
    frp_pred     = float(math.expm1(frp_log_pred))
    frp_pred     = max(0.0, frp_pred)

    risk_seviyesi, risk_renk = risk_siniflandir(frp_pred)

    mesaj = (
        f"{inp.acq_date} tarihinde ({inp.latitude:.2f}°N, {inp.longitude:.2f}°E) "
        f"konumunda tahmini FRP: {frp_pred:.1f} MW — {risk_seviyesi} risk."
    )

    return FireOutput(
        frp_tahmin=round(frp_pred, 2),
        frp_log_tahmin=round(frp_log_pred, 4),
        risk_seviyesi=risk_seviyesi,
        risk_renk=risk_renk,
        grid_id=grid_id,
        grid_frp_medyan=round(grid_frp_medyan, 2),
        mesaj=mesaj,
    )


@router.get("/grid_stats")
def grid_stats(limit: int = 20):
    """En aktif yangın ızgara hücrelerini döner."""
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model yüklenmedi.")

    grid_frp_med = lookup.get("grid_frp_med", {})
    grid_count   = lookup.get("grid_count",   {})

    rows = []
    for gid, count in grid_count.items():
        parts = gid.split("_")
        if len(parts) == 2:
            try:
                lat, lon = float(parts[0]), float(parts[1])
                rows.append({
                    "grid_id":     gid,
                    "lat":         lat,
                    "lon":         lon,
                    "yangin_sayisi": count,
                    "frp_medyan":  round(grid_frp_med.get(gid, 0), 2),
                })
            except ValueError:
                continue

    rows.sort(key=lambda x: x["yangin_sayisi"], reverse=True)
    return {"toplam_izgara": len(rows), "veriler": rows[:limit]}
