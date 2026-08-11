#!/bin/bash
# Backup Script for Sempoa SIP TC Pariaman Database
# Retains daily database dumps for 30 days.

BACKUP_DIR="/var/backups/sempoa_sip"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/sempoa_sip_backup_${TIMESTAMP}.sql.gz"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Perform pg_dump inside docker container or directly
echo "Starting PostgreSQL database backup..."
docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "Backup successfully created: ${BACKUP_FILE}"
else
  echo "Error: Database backup failed!"
  exit 1
fi

# Clean up backups older than 30 days
echo "Cleaning up backups older than 30 days..."
find "${BACKUP_DIR}" -type f -name "sempoa_sip_backup_*.sql.gz" -mtime +30 -delete

echo "Backup clean up finished."
