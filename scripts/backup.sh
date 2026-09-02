#!/bin/sh
# ==============================================================================
# Automated MongoDB Database Backup Script with Retention
# Smart Billing ERP
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backup}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="${DATABASE_NAME:-smart_billing_prod}"
MONGO_HOST="${MONGO_HOST:-mongo}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

FILENAME="${BACKUP_DIR}/${DATABASE_NAME}_backup_${TIMESTAMP}.archive.gz"

echo "📦 Starting MongoDB Backup for '${DATABASE_NAME}' at $(date)..."
mkdir -p "${BACKUP_DIR}"

# Execute compressed archive dump
mongodump --host="${MONGO_HOST}:27017" --db="${DATABASE_NAME}" --archive="${FILENAME}" --gzip

echo "✅ Backup successfully created at: ${FILENAME}"
ls -lh "${FILENAME}"

# Cleanup backups older than RETENTION_DAYS
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DATABASE_NAME}_backup_*.archive.gz" -mtime +"${RETENTION_DAYS}" -exec rm {} \;

echo "🏁 Backup process completed successfully at $(date)."
