#!/bin/bash
# ============================================================
# SCRIPT DEPLOY OTOMATIS - Sempoa SIP TC Pariaman
# Jalankan di VPS: bash /opt/sempoa-sip/deploy.sh
# ============================================================

set -e

echo "============================================"
echo "  DEPLOYING SEMPOA SIP TC PARIAMAN"
echo "============================================"

cd /opt/sempoa-sip

echo ""
echo "[1/4] Mengambil kode terbaru dari GitHub..."
git pull origin master

echo ""
echo "[2/4] Build ulang frontend TANPA cache lama..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

echo ""
echo "[3/4] Restart container frontend dan nginx..."
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend nginx

echo ""
echo "[4/4] Membersihkan image Docker yang tidak terpakai..."
docker image prune -f

echo ""
echo "============================================"
echo "  DEPLOY SELESAI!"
echo "  Silakan tes ulang di PageSpeed Insights:"
echo "  https://pagespeed.web.dev/"
echo "============================================"
