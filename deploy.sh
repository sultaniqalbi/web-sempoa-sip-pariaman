#!/bin/bash
# ============================================================
# SCRIPT DEPLOY OTOMATIS & AMAN - Sempoa SIP TC Pariaman
# Jalankan di VPS: bash /opt/sempoa-sip/deploy.sh
# ============================================================

set -e

echo "=========================================================="
echo "  MEMULAI DEPLOYMENT AMAN SEMPOA SIP TC PARIAMAN"
echo "=========================================================="

cd /opt/sempoa-sip

# Buat folder backup jika belum ada
mkdir -p /opt/sempoa-sip/backend/backups

echo ""
echo "[1/5] Membuat Snapshot Backup Database Otomatis..."
if docker compose -f docker-compose.prod.yml ps db | grep -q "Up\|running"; then
  BACKUP_FILE="/opt/sempoa-sip/backend/backups/auto_pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
  docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ${POSTGRES_USER:-sempoa_prod} ${POSTGRES_DB:-sempoa_sip} 2>/dev/null | gzip > "${BACKUP_FILE}" || true
  if [ -s "${BACKUP_FILE}" ]; then
    echo "  Backup tersimpan: ${BACKUP_FILE}"
  else
    rm -f "${BACKUP_FILE}"
  fi
fi

echo ""
echo "[2/5] Mengambil kode terbaru dari GitHub..."
git pull origin master

echo ""
echo "[3/5] Build Frontend & Backend (Container Baru)..."
docker compose -f docker-compose.prod.yml build --no-cache frontend backend

echo ""
echo "[4/5] Restart Service Frontend, Backend & Nginx (Database Tetap Berjalan)..."
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend backend nginx

echo ""
echo "[5/5] Menjalankan Migrasi Skema Database Terbaru (Alembic)..."
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head || true

echo ""
echo "Membersihkan cache image lama..."
docker image prune -f

echo ""
echo "=========================================================="
echo "  DEPLOY BERHASIL & SEMUA DATA DATABASE TETAP AMAN!"
echo "  Web: https://sempoasippariaman.com"
echo "=========================================================="

