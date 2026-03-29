#!/usr/bin/env bash
# BKZS — Sistemi Çalıştır
# Kullanım: ./start.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 BKZS Afet Harita Sistemi Başlatılıyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Backend ──────────────────────────────
echo "⚙️  Backend başlatılıyor (FastAPI / port 8000)..."

cd "$ROOT_DIR/backend"

# Venv yoksa oluştur
if [ ! -d "venv" ]; then
    echo "   Sanal ortam oluşturuluyor..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

# .env kontrolü
if [ ! -f ".env" ]; then
    echo "⚠️  .env dosyası bulunamadı! backend/.env oluşturun:"
    echo "   FIRMS_API_KEY=<NASA_FIRMS_API_KEY_BURAYA>"
    exit 1
fi

# Backend'i arka planda başlat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   ✅ Backend PID: $BACKEND_PID (http://localhost:8000)"

# Backend hazır olana kadar bekle
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   ✅ Backend sağlıklı!"
        break
    fi
    sleep 1
done

# ── Frontend ─────────────────────────────
echo ""
echo "🎨 Frontend başlatılıyor (Vite / port 5173)..."

cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Bağımlılıklar yükleniyor..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "   ✅ Frontend PID: $FRONTEND_PID (http://localhost:5173)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sistem hazır!"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:8000"
echo "   API Docs : http://localhost:8000/docs"
echo ""
echo "Durdurmak için: Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Her iki process'i bekle
wait $BACKEND_PID $FRONTEND_PID
