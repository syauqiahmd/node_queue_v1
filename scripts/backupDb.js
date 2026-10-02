#!/usr/bin/env node
/* eslint-disable no-console -- CLI script run by cron, console output is its log */
/* eslint-disable security/detect-non-literal-fs-filename -- paths come from config, not user input */
/**
 * Nightly PostgreSQL backup.
 *
 *   1. pg_dump (custom format, compressed) into BACKUP_DIR
 *   2. upload to S3 as a PRIVATE object under db-backups/, then verify it can't be read
 *      anonymously (the bucket also serves public audio files)
 *   3. delete local copies older than BACKUP_LOCAL_RETENTION_DAYS and S3 copies older than
 *      BACKUP_S3_RETENTION_DAYS
 *   4. write Prometheus metrics for Grafana alerting (read by Alloy's textfile collector)
 *
 * Usage: node scripts/backupDb.js   (reads DATABASE_URL and S3_* from .env)
 * Restore: see docs/BACKUP.md
 */
const path = require('path');
require('dotenv').config({
  path: process.env.BACKUP_ENV_FILE || path.join(__dirname, '..', '.env'),
});
const fs = require('fs');
const { spawn } = require('child_process');
// The v2 SDK prints a maintenance-mode notice on load; it would end up in the cron log daily.
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
const AWS = require('aws-sdk');

const S3_PREFIX = 'db-backups/';
const config = {
  backupDir: process.env.BACKUP_DIR || path.join(require('os').homedir(), 'backups', 'node_queue'),
  localRetentionDays: Number(process.env.BACKUP_LOCAL_RETENTION_DAYS) || 7,
  s3RetentionDays: Number(process.env.BACKUP_S3_RETENTION_DAYS) || 14,
  metricsFile: process.env.BACKUP_METRICS_FILE || '/var/lib/node_queue_metrics/db_backup.prom',
};

const log = (message) => console.log(`${new Date().toISOString()} [backup] ${message}`);

/** Splits DATABASE_URL into libpq env vars so the password never appears in `ps` output. */
function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
    // Prisma's ?schema=public is not a libpq option, so query params are dropped.
  };
}

function backupFileName(database, date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
  return `${database}_${stamp}.dump`;
}

function isOlderThan(date, days, now = new Date()) {
  return now.getTime() - new Date(date).getTime() > days * 24 * 60 * 60 * 1000;
}

function formatMetrics({ success, lastSuccessTs, runTs, sizeBytes, durationSeconds, uploaded }) {
  const lines = [
    [
      'node_queue_db_backup_success',
      'Whether the last backup run succeeded (1) or failed (0).',
      success ? 1 : 0,
    ],
    ['node_queue_db_backup_last_run_timestamp_seconds', 'Unix time of the last backup run.', runTs],
    [
      'node_queue_db_backup_last_success_timestamp_seconds',
      'Unix time of the last successful backup.',
      lastSuccessTs,
    ],
    ['node_queue_db_backup_size_bytes', 'Size of the last successful backup file.', sizeBytes],
    ['node_queue_db_backup_duration_seconds', 'Duration of the last backup run.', durationSeconds],
    [
      'node_queue_db_backup_s3_uploaded',
      'Whether the last backup was uploaded to S3 (1) or not (0).',
      uploaded ? 1 : 0,
    ],
  ];
  return lines
    .map(([name, help, value]) => `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name} ${value}`)
    .join('\n')
    .concat('\n');
}

function readPreviousMetric(file, name) {
  try {
    const line = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name} `));
    return line ? Number(line.slice(name.length + 1)) : 0;
  } catch {
    return 0;
  }
}

// Written atomically (temp file + rename) so Alloy never reads a half-written file.
function writeMetrics(file, metrics) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, formatMetrics(metrics), { mode: 0o640 });
    fs.chmodSync(tmp, 0o640);
    fs.renameSync(tmp, file);
  } catch (error) {
    log(`WARNING: could not write metrics to ${file}: ${error.message}`);
  }
}

function runPgDump(pgEnv, outputFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('pg_dump', ['--format=custom', '--compress=9', '--file', outputFile], {
      env: { ...process.env, ...pgEnv },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`pg_dump exited with code ${code}`))
    );
  });
}

function createS3() {
  return new AWS.S3({
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION,
    s3ForcePathStyle: true,
  });
}

/** Fails (and removes the object) if the backup is readable without credentials. */
async function assertNotPublic(s3, bucket, key) {
  // Use the SDK's resolved endpoint: S3_ENDPOINT may omit the scheme (the SDK adds https).
  const publicUrl = `${s3.endpoint.href.replace(/\/$/, '')}/${bucket}/${key}`;
  const res = await fetch(publicUrl, { method: 'HEAD' });
  if (res.ok) {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    throw new Error(`Backup was publicly readable at ${publicUrl}; deleted it from S3`);
  }
  log(`Verified backup is private (anonymous HEAD returned ${res.status})`);
}

async function pruneS3(s3, bucket, retentionDays, now = new Date()) {
  const { Contents = [] } = await s3.listObjectsV2({ Bucket: bucket, Prefix: S3_PREFIX }).promise();
  const expired = Contents.filter((obj) => isOlderThan(obj.LastModified, retentionDays, now));
  for (const obj of expired) {
    await s3.deleteObject({ Bucket: bucket, Key: obj.Key }).promise();
  }
  return expired.length;
}

function pruneLocal(dir, retentionDays, now = new Date()) {
  const expired = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.dump'))
    .map((name) => path.join(dir, name))
    .filter((file) => isOlderThan(fs.statSync(file).mtime, retentionDays, now));
  expired.forEach((file) => fs.unlinkSync(file));
  return expired.length;
}

async function main() {
  const start = Date.now();
  const runTs = Math.floor(start / 1000);
  const previousSuccessTs = readPreviousMetric(
    config.metricsFile,
    'node_queue_db_backup_last_success_timestamp_seconds'
  );
  let uploaded = false;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    const pgEnv = parseDatabaseUrl(process.env.DATABASE_URL);
    fs.mkdirSync(config.backupDir, { recursive: true, mode: 0o700 });

    const fileName = backupFileName(pgEnv.PGDATABASE);
    const filePath = path.join(config.backupDir, fileName);
    log(`Dumping ${pgEnv.PGDATABASE} to ${filePath}`);
    await runPgDump(pgEnv, filePath);
    fs.chmodSync(filePath, 0o600);
    const sizeBytes = fs.statSync(filePath).size;
    log(`Dump complete (${(sizeBytes / 1024).toFixed(1)} KB)`);

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket || !process.env.S3_ENDPOINT) {
      throw new Error('S3_BUCKET_NAME / S3_ENDPOINT are not set');
    }
    const s3 = createS3();
    const key = `${S3_PREFIX}${fileName}`;
    await s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: fs.createReadStream(filePath),
        ACL: 'private',
        ContentType: 'application/octet-stream',
      })
      .promise();
    log(`Uploaded to s3://${bucket}/${key}`);
    await assertNotPublic(s3, bucket, key);
    uploaded = true;

    const s3Deleted = await pruneS3(s3, bucket, config.s3RetentionDays);
    const localDeleted = pruneLocal(config.backupDir, config.localRetentionDays);
    log(`Pruned ${localDeleted} local and ${s3Deleted} S3 backups past retention`);

    writeMetrics(config.metricsFile, {
      success: true,
      lastSuccessTs: runTs,
      runTs,
      sizeBytes,
      durationSeconds: (Date.now() - start) / 1000,
      uploaded,
    });
    log('Backup finished successfully');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    writeMetrics(config.metricsFile, {
      success: false,
      lastSuccessTs: previousSuccessTs,
      runTs,
      sizeBytes: 0,
      durationSeconds: (Date.now() - start) / 1000,
      uploaded,
    });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  S3_PREFIX,
  createS3,
  parseDatabaseUrl,
  backupFileName,
  isOlderThan,
  formatMetrics,
  readPreviousMetric,
};
