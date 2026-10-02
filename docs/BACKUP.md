# Database Backups

Nightly PostgreSQL backups of `qms_prod`, kept on the VPS and in S3.

| | |
| --- | --- |
| Script | [`scripts/backupDb.js`](../scripts/backupDb.js) |
| Schedule | 02:30 WITA daily (crontab of the app user) |
| Format | `pg_dump --format=custom` (compressed, restorable with `pg_restore`) |
| Local copies | `~/backups/node_queue/*.dump`, last **7 days** (`BACKUP_LOCAL_RETENTION_DAYS`) |
| Off-site copies | `s3://$S3_BUCKET_NAME/db-backups/`, last **14 days** (`BACKUP_S3_RETENTION_DAYS`), uploaded as **private** objects |
| Run log | `~/backups/node_queue/backup.log` |
| Metrics / alerts | `node_queue_db_backup_*` in Grafana, see [MONITORING.md](./MONITORING.md) |

The S3 bucket also serves the public audio files (`/audio/` on the UI domain proxies to it), so
every run checks that the uploaded backup is **not** readable anonymously. If it is, the script
deletes it from S3 and fails.

Credentials come from the app's `.env` (`DATABASE_URL`, `S3_*`); nothing extra is stored.

## Setup

```bash
mkdir -p -m 700 ~/backups/node_queue
sudo install -d -o <user> -g alloy -m 2750 /var/lib/node_queue_metrics   # metrics for Alloy
crontab -e
```

```
30 2 * * * cd /home/<user>/sites/node_queue_v1 && /usr/bin/node scripts/backupDb.js >> /home/<user>/backups/node_queue/backup.log 2>&1  # node_queue: nightly db backup
```

Run it once by hand and check `node_queue_db_backup_success 1` in
`/var/lib/node_queue_metrics/db_backup.prom`.

## Restore

The database commands below were tested on the VPS against scratch databases on 2026-10-03 (see
the test log at the end); only `CREATE ROLE`, `npm ci` and the `pm2` commands were not run there.
Pick the scenario that matches what happened:

| Scenario | Go to |
| --- | --- |
| Data was deleted or corrupted, the server is fine | [A. Restore on the same server](#a-restore-on-the-same-server) |
| A few rows were deleted by mistake | [B. Recover specific rows](#b-recover-specific-rows) |
| The VPS is gone / moving to a new server | [C. Restore on a new server](#c-restore-on-a-new-server) |

Names used below: database `qms_prod`, app database user `qms_user` (the user in
`DATABASE_URL`, owner of all tables), app folder `~/sites/node_queue_v1`.

### 1. Get a backup file

Local copies (last 7 days) are already on the server:

```bash
ls -lt ~/backups/node_queue/
```

Or download from S3 (last 14 days) — needs the app's `.env` for the S3 credentials:

```bash
cd ~/sites/node_queue_v1
node scripts/downloadBackup.js                     # list, newest first
node scripts/downloadBackup.js latest              # -> /tmp/<file>.dump
node scripts/downloadBackup.js qms_prod_20261002_172402.dump /tmp/restore.dump
```

Backup file names are `qms_prod_<UTC date>_<UTC time>.dump`; 02:30 WITA is 18:30 UTC of the
previous day.

### 2. Always check the file first

Restore into a throwaway database and look at the data before touching `qms_prod`:

```bash
sudo -u postgres createdb --owner=qms_user restore_check
sudo -u postgres pg_restore --no-owner --role=qms_user -d restore_check < /tmp/restore.dump
sudo -u postgres psql -d restore_check -c 'select count(*) from "Ticket";'
sudo -u postgres psql -d restore_check -c 'select max(created_at) from "Ticket";'   # how recent is it?
```

Keep `restore_check` if you need it for scenario B; otherwise drop it:

```bash
sudo -u postgres dropdb restore_check
```

The `< /tmp/restore.dump` redirect is done by your shell, so the file can stay private (`600`).

### A. Restore on the same server

Replaces **all** data in `qms_prod` with the backup. Anything written after the backup was taken is
lost.

```bash
cd ~/sites/node_queue_v1

# 1. Save the current state first, even if it's broken (you may need something from it)
node scripts/backupDb.js

# 2. Stop everything that writes to the database
pm2 stop node-queue-api node-queue-cron node-queue-websocket

# 3. Restore (drops and recreates every table, owned by qms_user)
sudo -u postgres pg_restore --clean --if-exists --no-owner --role=qms_user -d qms_prod < /tmp/restore.dump

# 4. Start again and check
pm2 start node-queue-api node-queue-cron node-queue-websocket
curl -s localhost:8000/api/v1/health
rm /tmp/restore.dump
```

Then log in to the UI and check a few recent records. Cached lists in Redis can still show the
pre-restore data until they expire. To clear them now without logging anyone out (sessions are
the `auth:token:*` keys, which this leaves alone):

```bash
for p in counter organization service user; do redis-cli --scan --pattern "$p:*" | xargs -r redis-cli del; done
```

### B. Recover specific rows

When only some rows were deleted (e.g. a visitor or tickets), copy them back from the scratch
database instead of restoring everything. Keep `restore_check` from step 2, then:

```bash
# 1. Export the rows you need from the backup
sudo -u postgres psql -d restore_check \
  -c "\copy (select * from \"Visitor\" where id in ('<id-1>', '<id-2>')) to '/tmp/rows.csv' csv header"

# 2. Import them into production
sudo -u postgres psql -d qms_prod -c "\copy \"Visitor\" from '/tmp/rows.csv' csv header"

# 3. Clean up
sudo -u postgres dropdb restore_check
sudo rm /tmp/rows.csv
```

Column names in SQL are the database names (`created_at`, `visitor_id`), not the Prisma field
names. Restore parent rows before child rows (e.g. `Visitor` before `VisitorHistory`/`Ticket`) or the
foreign keys will reject them. If the rows still exist in production with the same ids, the import
fails with a duplicate key error — nothing is overwritten.

### C. Restore on a new server

1. Set up the server with `docs/VPS_SETUP.md` (PostgreSQL 16, Node, PM2), deploy the app code, and
   copy the `.env` from your password manager / old server.
2. Create the database user and an empty database. Use the password from `DATABASE_URL`:

   ```bash
   sudo -u postgres psql -c "CREATE ROLE qms_user LOGIN PASSWORD '<password from DATABASE_URL>';"
   sudo -u postgres createdb --owner=qms_user qms_prod
   ```

3. Download the newest backup from S3 and restore it:

   ```bash
   cd ~/sites/node_queue_v1 && npm ci
   node scripts/downloadBackup.js latest /tmp/restore.dump
   sudo -u postgres pg_restore --no-owner --role=qms_user -d qms_prod < /tmp/restore.dump
   rm /tmp/restore.dump
   ```

4. The migration history (`_prisma_migrations`) is restored with the data, so
   `npx prisma migrate deploy` only applies migrations that are newer than the backup. Run it if
   the deployed code is newer; it is a no-op otherwise.
5. Start the services (`pm2 start ...`), check `/api/v1/health`, then set up the backup cron and
   monitoring again (this file's [Setup](#setup) and `docs/MONITORING.md`).

## Restore test log

| Date | Backup | Result |
| --- | --- | --- |
| 2026-10-03 | `qms_prod_20261002_172402.dump` (275 KB) | Restored into a scratch DB; row counts of all 10 tables matched production |
| 2026-10-03 | same | Scenario B on two scratch DBs: deleted a `Visitor`, recovered it with the `\copy` commands; re-importing failed with a duplicate key error as documented |
| 2026-10-03 | same, downloaded with `downloadBackup.js` | Scenario C steps (empty DB owned by `qms_user`) and scenario A `--clean` restore over existing data, on a scratch DB: row counts matched, all tables owned by `qms_user`, app user can read them |
