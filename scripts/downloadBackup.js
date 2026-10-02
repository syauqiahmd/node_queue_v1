#!/usr/bin/env node
/* eslint-disable no-console -- CLI script, console output is the interface */
/* eslint-disable security/detect-non-literal-fs-filename -- destination path comes from the operator */
/**
 * Lists or downloads database backups from S3 (uploaded by scripts/backupDb.js).
 *
 *   node scripts/downloadBackup.js                  list backups, newest first
 *   node scripts/downloadBackup.js latest [dest]    download the newest backup
 *   node scripts/downloadBackup.js <file> [dest]    download a specific backup
 *
 * dest defaults to /tmp/<file>. Reads S3_* from .env (or BACKUP_ENV_FILE). See docs/BACKUP.md.
 */
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { S3_PREFIX, createS3 } = require('./backupDb');

async function listBackups(s3, bucket) {
  const { Contents = [] } = await s3.listObjectsV2({ Bucket: bucket, Prefix: S3_PREFIX }).promise();
  return Contents.filter((obj) => obj.Key.endsWith('.dump')).sort(
    (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
  );
}

async function main() {
  const [target, destArg] = process.argv.slice(2);
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket || !process.env.S3_ENDPOINT) {
    throw new Error('S3_BUCKET_NAME / S3_ENDPOINT are not set (check .env)');
  }
  const s3 = createS3();
  const backups = await listBackups(s3, bucket);

  if (!target) {
    if (!backups.length) {
      console.log(`No backups found in s3://${bucket}/${S3_PREFIX}`);
      return;
    }
    backups.forEach((obj) =>
      console.log(
        `${path.basename(obj.Key)}  ${(obj.Size / 1024).toFixed(1).padStart(8)} KB  ${new Date(obj.LastModified).toISOString()}`
      )
    );
    return;
  }

  const backup =
    target === 'latest'
      ? backups[0]
      : backups.find((obj) => path.basename(obj.Key) === path.basename(target));
  if (!backup) {
    throw new Error(`Backup "${target}" not found. Run without arguments to list backups.`);
  }

  const dest = destArg || path.join('/tmp', path.basename(backup.Key));
  await pipeline(
    s3.getObject({ Bucket: bucket, Key: backup.Key }).createReadStream(),
    fs.createWriteStream(dest, { mode: 0o600 })
  );
  console.log(
    `Downloaded ${path.basename(backup.Key)} (${(backup.Size / 1024).toFixed(1)} KB) to ${dest}`
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
