#!/bin/bash
# ============================================================
# SCRIPT RESTORE DATABASE SEMPOA SIP TC PARIAMAN
# Mengembalikan database dari snapshot backup
# ============================================================
set -e

cd /opt/sempoa-sip

BACKUP_DIR="/opt/sempoa-sip/backend/backups"

# Jika user memberikan nama file spesifik sebagai parameter, gunakan itu
if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  # Cari file backup otomatis sebelum deploy
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
echo "  MEMULAI RESTORE DATABASE DARI BACKUP"
echo "  File Backup: ${BACKUP_FILE}"
echo "=========================================================="

echo "Memulihkan database PostgreSQL..."
gunzip -c "${BACKUP_FILE}" | docker compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-sempoa_prod} -d ${POSTGRES_DB:-sempoa_sip}

echo ""
echo "=========================================================="
echo "  ✅ RESTORE BERHASIL! SEMUA DATA TELAH DIKEMBALIKAN"
echo "=========================================================="
