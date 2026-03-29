# ==========================================
# STAGE 1: Frontend Build (Vite/React)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Uyarıları ve gereksiz logları azaltmak için ortam değişkenleri
ENV CI=true

# Paket bağımlılıklarını kur (Cache performansını artırmak için package.json önce alınır)
COPY frontend/package*.json ./
RUN npm install

# Frontend kaynak kodlarını kopyala ve build et
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Backend & Final Image (FastAPI)
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# İşletim sistemi güncellemeleri ve gereksinimleri (Ağır kütüphaneler için opsiyonel)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Backend bağımlılıklarını kur
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend kodlarını kopyala
COPY backend/ ./backend/

# Stage 1'den çıkan build (dist) klasörünü Backend'in static servisine kopyala
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Python buffer optimizasyonu (Hataları anında loglamak için)
ENV PYTHONUNBUFFERED=1

# Backend klasörünü çalışma dizini yap
WORKDIR /app/backend

# Google Cloud Run tarafından verilen PORT değişkenini dinle (Yoksa 8000)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
