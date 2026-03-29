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


import os
from fastapi.responses import FileResponse

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

frontend_build_path = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(frontend_build_path):
    # Mount Vite's assets output folder specifically
    assets_path = os.path.join(frontend_build_path, "assets")
    if os.path.isdir(assets_path):
        from fastapi.staticfiles import StaticFiles
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # If the file exists directly in root (like vite.svg, robots.txt)
        requested_file = os.path.join(frontend_build_path, full_path)
        if full_path and os.path.isfile(requested_file):
            return FileResponse(requested_file)
            
        # Fallback to index.html for React Router
        index_file = os.path.join(frontend_build_path, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        
        return {"message": "Welcome to Afet Harita API - Frontend not built yet"}

@app.get("/")
def read_root():
    # Sadece /static yoksa fallback olarak çalışır
    return {"message": "Welcome to Afet Harita API"}
