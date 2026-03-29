"""
Afet Harita API
----------------
Afet yönetimi dashboard backend servisi.
NASA FIRMS uydu verisi ile yangın tespiti ve harita entegrasyonu.
"""

import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.disasters import router as disasters_router

# .env dosyasından ortam değişkenlerini yükle
load_dotenv()

# Logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Afet Harita API",
    description="Afet Yönetiminde Yerli Uydu Verisi Entegrasyonu — BKZS",
    version="1.0.0",
)

# CORS — Frontend localhost:5173'ten erişim
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(disasters_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Afet Harita API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
