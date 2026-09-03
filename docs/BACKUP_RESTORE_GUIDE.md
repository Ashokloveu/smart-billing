# Backup, Disaster Recovery & Restore Testing Guide

**System:** Smart Billing ERP  
**Target:** MongoDB 7.0 Enterprise Engine  
**Retention Policy:** 30-Day Automated Rolling Retention

---

## 1. Automated Nightly Backups

Backups are executed via [scripts/backup.sh](file:///c:/Users/bsmar/Desktop/Smart%20Billing/scripts/backup.sh) on a scheduled cron daemon (`0 2 * * *`):

```bash
# Manual Backup Execution:
./scripts/backup.sh
```

**Features:**
- Gzip compressed archive (`.archive.gz`).
- Automatic cleanup of archives older than `RETENTION_DAYS` (default: 30 days).
- Ready for cloud upload to encrypted AWS S3 or Cloudflare R2 bucket:
  ```bash
  aws s3 cp /backup/*.archive.gz s3://smart-billing-encrypted-backups/mongo/
  ```

---

## 2. Disaster Recovery & Restore Testing Procedure

To verify backup validity or recover after catastrophic hardware loss:

### Step 1: Run Test Restore into Staging
Use the automated restore runner [scripts/restore.sh](file:///c:/Users/bsmar/Desktop/Smart%20Billing/scripts/restore.sh):
```bash
./scripts/restore.sh /backup/smart_billing_prod_backup_YYYYMMDD_HHMMSS.archive.gz
```
This restores all collections into the isolated test database `smart_billing_test_restore` without touching live production data.

### Step 2: Validate Data Integrity
Run the regression invariant suite against the restored database:
```bash
node backend/scripts/verify_invariants.js
```
Assert that:
1. Double-entry general ledger debits equal credits.
2. Inventory balances and stock movement logs are intact.
3. Statutory tax registers match invoice totals.

### Step 3: Production Emergency Recovery
In a complete disaster scenario requiring live database restoration:
```bash
mongorestore --host="mongo:27017" --archive="/backup/latest.archive.gz" --gzip --drop
```
Restart backend containers and inspect `/readyz`.
