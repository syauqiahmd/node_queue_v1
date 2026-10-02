/* eslint-disable security/detect-non-literal-fs-filename -- temp files in tests */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  parseDatabaseUrl,
  backupFileName,
  isOlderThan,
  formatMetrics,
  readPreviousMetric,
} = require('../../scripts/backupDb');

describe('backupDb', () => {
  describe('parseDatabaseUrl', () => {
    it('splits a Prisma URL into libpq env vars and drops ?schema', () => {
      expect(
        parseDatabaseUrl(
          'postgresql://qms_user:p%40ss%3Aword@127.0.0.1:5433/qms_prod?schema=public'
        )
      ).toEqual({
        PGHOST: '127.0.0.1',
        PGPORT: '5433',
        PGUSER: 'qms_user',
        PGPASSWORD: 'p@ss:word',
        PGDATABASE: 'qms_prod',
      });
    });

    it('defaults the port to 5432', () => {
      expect(parseDatabaseUrl('postgresql://u:p@localhost/db').PGPORT).toBe('5432');
    });
  });

  it('names backups by database and UTC timestamp', () => {
    expect(backupFileName('qms_prod', new Date('2026-10-03T18:30:05.123Z'))).toBe(
      'qms_prod_20261003_183005.dump'
    );
  });

  it('detects files past retention', () => {
    const now = new Date('2026-10-15T00:00:00Z');
    expect(isOlderThan('2026-10-07T23:59:00Z', 7, now)).toBe(true);
    expect(isOlderThan('2026-10-08T00:01:00Z', 7, now)).toBe(false);
  });

  it('formats Prometheus textfile metrics', () => {
    const text = formatMetrics({
      success: true,
      lastSuccessTs: 1700000000,
      runTs: 1700000000,
      sizeBytes: 2048,
      durationSeconds: 1.5,
      uploaded: true,
    });

    expect(text).toContain(
      '# TYPE node_queue_db_backup_success gauge\nnode_queue_db_backup_success 1'
    );
    expect(text).toContain('node_queue_db_backup_last_success_timestamp_seconds 1700000000');
    expect(text).toContain('node_queue_db_backup_size_bytes 2048');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('keeps the previous last-success time when reading an existing metrics file', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'backup-')), 'db_backup.prom');
    fs.writeFileSync(
      file,
      formatMetrics({
        success: true,
        lastSuccessTs: 1690000000,
        runTs: 1690000000,
        sizeBytes: 1,
        durationSeconds: 1,
        uploaded: true,
      })
    );

    expect(readPreviousMetric(file, 'node_queue_db_backup_last_success_timestamp_seconds')).toBe(
      1690000000
    );
    expect(readPreviousMetric('/nonexistent/file.prom', 'node_queue_db_backup_success')).toBe(0);
  });
});
