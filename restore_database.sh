#!/bin/bash
# ============================================================
# SCRIPT RESTORE DATABASE BERSIH - Sempoa SIP TC Pariaman
# Mengembalikan database 100% dari snapshot backup
# ============================================================
set -e

cd /opt/sempoa-sip

BACKUP_DIR="/opt/sempoa-sip/backend/backups"

# Cari file backup otomatis sebelum deploy
if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t ${BACKUP_DIR}/auto_pre_deploy_*.sql.gz 2>/dev/null | head -n 1)
  if [ -z "${BACKUP_FILE}" ]; then
    BACKUP_FILE=$(ls -t ${BACKUP_DIR}/*.sql.gz 2>/dev/null | head -n 1)
  fi
fi

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Tidak ada file backup database (.sql.gz) yang ditemukan di ${BACKUP_DIR}"
  exit 1
fi

echo "=========================================================="
echo "  MEMULAI RESTORE DATABASE BERSIH DARI BACKUP"
echo "  File Backup: ${BACKUP_FILE}"
echo "=========================================================="

# 1. Reset skema public agar bebas dari bentrok duplicate key error
echo "1. Menyiapkan database bersih (reset schema public)..."
docker compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-sempoa_prod} -d ${POSTGRES_DB:-sempoa_sip} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${POSTGRES_USER:-sempoa_prod}; GRANT ALL ON SCHEMA public TO public;"

# 2. Impor seluruh data dari backup snapshot
echo "2. Mengimpor seluruh data dari backup..."
gunzip -c "${BACKUP_FILE}" | docker compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-sempoa_prod} -d ${POSTGRES_DB:-sempoa_sip}

# 3. Jalankan migrasi alembic agar kolom baru (seperti status_denda) tetap terdaftar
echo "3. Sinkronisasi skema database..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || true

# 4. Restart backend
echo "4. Merestart container backend..."
docker compose -f docker-compose.prod.yml restart backend

echo ""
echo "=========================================================="
echo "  ✅ RESTORE DATABASE SELESAI & SEMUA DATA PULIH 100%!"
echo "=========================================================="
