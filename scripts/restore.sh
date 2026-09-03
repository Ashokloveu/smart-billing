#!/bin/sh
# ==============================================================================
# Automated MongoDB Database Restore & Invariant Verification Script
# Smart Billing ERP
# ==============================================================================

set -e

BACKUP_FILE="$1"
TEST_DB="${TEST_DB:-smart_billing_test_restore}"
MONGO_HOST="${MONGO_HOST:-mongo}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "❌ Error: Please provide the backup archive file path."
  echo "Usage: ./restore.sh /path/to/backup.archive.gz"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup archive '${BACKUP_FILE}' not found."
  exit 1
fi

echo "🔄 Initiating Database Restore Testing into '${TEST_DB}'..."
echo "📦 Archive: ${BACKUP_FILE}"

# Restore into isolated staging/test database
mongorestore --host="${MONGO_HOST}:27017" --nsInclude="*" --nsFrom="*" --nsTo="${TEST_DB}.*" --archive="${BACKUP_FILE}" --gzip --drop

echo "✅ Backup restored successfully into '${TEST_DB}'."
echo "🏁 Ready for automated invariant integrity checks."
