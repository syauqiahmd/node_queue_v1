#!/bin/bash
# Installs the maintenance timers for the Docker deployment. Idempotent; run as root from the
# deploy folder owner's checkout:   sudo bash scripts/install-maintenance.sh
#   - qms-backup.timer       02:30 nightly DB backup (docker compose --profile tools run --rm backup)
#   - qms-log-cleanup.timer  03:15 delete app logs older than 30 days
#   - qms-docker-prune.timer Sun 04:00 remove images/build cache unused for 7 days (not volumes)
#   - /var/lib/node_queue_metrics for backup metrics (read by Grafana Alloy, group "alloy")
#   - optional: installs ./alloy-config.alloy as /etc/alloy/config.alloy if it exists
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run with sudo"; exit 1; }
SITE="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="$(stat -c %U "$SITE")"
METRICS_GROUP=$(getent group alloy >/dev/null && echo alloy || echo "$APP_USER")

install -d -m 2750 -o "$APP_USER" -g "$METRICS_GROUP" /var/lib/node_queue_metrics
chown "$APP_USER:$METRICS_GROUP" /var/lib/node_queue_metrics/* 2>/dev/null || true

cat > /etc/systemd/system/qms-backup.service <<UNIT
[Unit]
Description=QMS nightly PostgreSQL backup (scripts/backupDb.js)
Wants=docker.service
After=docker.service

[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$SITE
ExecStart=/usr/bin/docker compose --profile tools run --rm --no-TTY backup
TimeoutStartSec=30min
UNIT

cat > /etc/systemd/system/qms-backup.timer <<'UNIT'
[Unit]
Description=QMS nightly PostgreSQL backup at 02:30

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=60

[Install]
WantedBy=timers.target
UNIT

cat > /etc/systemd/system/qms-log-cleanup.service <<UNIT
[Unit]
Description=QMS: delete app logs older than 30 days

[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
ExecStart=/usr/bin/find $SITE/logs -type f ( -name *.log -o -name *.log.gz ) -mtime +30 -print -delete
UNIT

cat > /etc/systemd/system/qms-log-cleanup.timer <<'UNIT'
[Unit]
Description=QMS app log cleanup at 03:15

[Timer]
OnCalendar=*-*-* 03:15:00
Persistent=true

[Install]
WantedBy=timers.target
UNIT

cat > /etc/systemd/system/qms-docker-prune.service <<UNIT
[Unit]
Description=QMS: remove Docker images and build cache unused for 7 days
Wants=docker.service
After=docker.service

[Service]
Type=oneshot
User=$APP_USER
Group=docker
ExecStart=/usr/bin/docker image prune -f --filter until=168h
ExecStart=/usr/bin/docker builder prune -f --filter until=168h
ExecStartPost=/usr/bin/docker system df
UNIT

cat > /etc/systemd/system/qms-docker-prune.timer <<'UNIT'
[Unit]
Description=QMS weekly Docker cleanup (Sunday 04:00)

[Timer]
OnCalendar=Sun *-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
UNIT

if [ -f "$SITE/alloy-config.alloy" ]; then
  cp -a /etc/alloy/config.alloy /etc/alloy/config.alloy.bak-$(date +%Y%m%d%H%M%S)
  install -m 640 -o root -g alloy "$SITE/alloy-config.alloy" /etc/alloy/config.alloy
  rm -f "$SITE/alloy-config.alloy"
  alloy fmt /etc/alloy/config.alloy >/dev/null
  systemctl restart alloy
  echo "alloy config updated + restarted"
fi

systemctl daemon-reload
systemctl enable --now qms-backup.timer qms-log-cleanup.timer qms-docker-prune.timer
echo "--- running first backup now..."
systemctl start qms-backup.service && echo "backup OK" || echo "backup FAILED: journalctl -u qms-backup -n 50"
journalctl -u qms-backup.service -n 12 --no-pager -o cat | grep -E "\[backup\]|kept" || true
echo "--- metrics:"; grep -E "^node_queue_db_backup_(success|s3_uploaded|size_bytes) " /var/lib/node_queue_metrics/db_backup.prom || true
echo "--- timers:"; systemctl list-timers 'qms-*' --no-pager | head -4
