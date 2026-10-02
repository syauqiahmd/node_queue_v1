# Monitoring (Grafana Cloud)

How the node_queue services and the UI are observed in Grafana Cloud, what runs on the VPS, and
the queries to build dashboards and alerts from.

---

## 1. What is collected

| Source | What | How it gets to Grafana | Query with |
| --- | --- | --- | --- |
| Host (`qms-vps`) | CPU, memory, disk, network | Alloy `prometheus.exporter.unix` | `{job="integrations/node_exporter"}` (metrics) |
| PostgreSQL | Up, connections by state, database size, transactions, deadlocks, cache hits, locks | Alloy `prometheus.exporter.postgres` (read-only `grafana_monitor` role) | `pg_*` |
| Redis | Up, memory, clients, hits/misses, evictions, commands/s | Alloy `prometheus.exporter.redis` | `redis_*` |
| DB backup log | Each backup run's output (`~/backups/node_queue/backup.log`) | Alloy, exact-path file (ACL: traverse on the folder, read on this file only — not the dumps); config in [`monitoring/backup_log.alloy`](./monitoring/backup_log.alloy) | `{job="backup"}` |
| DB backups | Last success time, size, S3 upload — see [BACKUP.md](./BACKUP.md) | `scripts/backupDb.js` writes a textfile Alloy reads | `node_queue_db_backup_*` |
| Processes | CPU, memory, restarts per service: `node-queue-api`, `node-queue-cron`, `node-queue-websocket`, `qms-mpp-ui`, `pm2-daemon`, `postgres`, `redis-server`, `nginx`, `alloy` | Alloy `prometheus.exporter.process` | `namedprocess_namegroup_*{groupname="..."}` |
| App logs | winston JSON from all 3 services (`error`, `warn`, `info`; `debug` is not shipped) | Alloy tails `logs/{error,warn,info}/*.log` | `{job="node_queue", service="node-queue-api"}` |
| PM2 stderr | Crashes before the logger starts, raw stack traces | Alloy tails `~/.pm2/logs/node-queue-*-error-*.log` | `{job="pm2", service="..."}` |
| nginx | Access log (JSON) for `api.`, `ws.` and the UI domain + error log | Alloy tails `/var/log/nginx/access.json.log`, `error.log` | `{job="nginx", stream="access"}` |
| UI (browser) | JS errors, Vue errors, failed API calls (5xx/network), web vitals, page views | Grafana Faro SDK in `node-queue-ui` | Frontend Observability app |
| Uptime | `/health` endpoints and the UI from outside | Grafana Synthetic Monitoring | Synthetics app |

Labels kept small on purpose (Loki cost/performance): `job`, `service`, `level`, `stream`, `host`.
Everything else (`statusCode`, `route`, `durationMs`, `transactionId`, ...) is a JSON field — use
`| json` in queries.

### Health endpoints

| Service | URL | Checks |
| --- | --- | --- |
| node-queue-api | `GET https://api.qms-mpp.web.id/api/v1/health` | database, Redis |
| node-queue-websocket | `GET https://ws.qms-mpp.web.id/health` | Redis pub/sub subscriber; also returns connected `clients` |

Both return `200` with `"status":"ok"` or `503` with `"status":"degraded"`.

`node-queue-cron` has no port; it is monitored through its logs (each run logs
`[CRON] <job> finished` with `durationMs`) and process metrics.

---

## 2. Personal data

Nothing with personal data should reach Grafana Cloud. Three layers:

1. **App** — `src/infra/utils/redact.js` masks phone numbers, emails and credentials in every log
   line; the request context path has no query string.
2. **Alloy** — the `loki.process "redact"` stage strips query strings and masks phone
   numbers/emails/JWTs again before shipping (also covers logs written by older deployed code and
   nginx/PM2 output).
3. **Browser** — Faro's `beforeSend` runs `src/helpers/redact.js` (UI repo); console output is
   not collected.

nginx's JSON log uses `$uri` (no query string) and omits the referer. Client IPs
(`remote_addr`, `requestContext.ip`) **are** shipped, for abuse investigation.

---

## 3. VPS setup

Alloy runs as the `alloy` systemd service (apt package from `apt.grafana.com`).

| File | Purpose |
| --- | --- |
| `/etc/alloy/config.alloy` | Grafana-generated blocks (remote_write, loki.write, alloy self-check) + [`monitoring/node-exporter.alloy`](./monitoring/node-exporter.alloy) + [`monitoring/node_queue_observability.alloy`](./monitoring/node_queue_observability.alloy) |
| `/etc/default/alloy` | `GCLOUD_RW_API_KEY=...`, `POSTGRES_MONITOR_DSN=...` (root only, `600`) |
| [`monitoring/db_exporters.alloy`](./monitoring/db_exporters.alloy) | Postgres + Redis collectors (appended to `config.alloy`) |
| `/etc/nginx/conf.d/observability_log.conf` | JSON access log, see [`monitoring/nginx-observability_log.conf`](./monitoring/nginx-observability_log.conf) |

File access for the `alloy` user is granted with ACLs, not group membership, so it can read the log
folders but not `.env` or anything else in the home directory:

```bash
sudo apt-get install -y acl
sudo setfacl -m u:alloy:x /home/<user> /home/<user>/sites /home/<user>/sites/node_queue_v1 /home/<user>/.pm2
sudo setfacl -R -m u:alloy:rX /home/<user>/sites/node_queue_v1/logs /home/<user>/.pm2/logs
sudo setfacl -R -d -m u:alloy:rX /home/<user>/sites/node_queue_v1/logs /home/<user>/.pm2/logs
chmod 600 <app>/.env <app>/src/infra/config/credentials.json ~/.pm2/dump.pm2
```

Changing the config:

```bash
sudo alloy fmt /etc/alloy/config.alloy > /dev/null && echo OK   # syntax
sudo -u alloy alloy validate /etc/alloy/config.alloy            # components
sudo systemctl restart alloy
curl -s localhost:12345/metrics | grep -E "^loki_write_sent_entries_total|samples_failed_total"
```

Alloy's UI is on `127.0.0.1:12345` only (use `ssh -L 12345:localhost:12345` to view it).
Resource use: ~235 MB RSS, ~1,500 metric series.

Postgres monitoring role (statistics only — `SELECT` on app tables is denied):

```sql
CREATE ROLE grafana_monitor LOGIN PASSWORD '<random>' CONNECTION LIMIT 3;
GRANT pg_monitor TO grafana_monitor;
```

`POSTGRES_MONITOR_DSN=postgresql://grafana_monitor:<password>@127.0.0.1:5432/qms_prod?sslmode=disable`

---

## 4. Grafana Cloud setup (UI steps)

1. **Linux integration** — done; dashboards under *Linux node / Overview*.
2. **Synthetic Monitoring** (*Monitor a URL*), after the API/websocket changes are deployed:
   - `https://api.qms-mpp.web.id/api/v1/health` — expect `200`
   - `https://ws.qms-mpp.web.id/health` — expect `200`
   - `https://qms-mpp.web.id/` — expect `200`

   Check the free-tier execution quota and pick the interval accordingly (e.g. every 2–5 min
   from 1–2 probes).
3. **Frontend Observability** — create an app named `qms-mpp-ui`, allowed origin
   `https://qms-mpp.web.id`, copy the collector URL into the UI's `.env.production` as
   `VITE_FARO_URL`, rebuild and restart the UI.

---

## 5. Queries

### Logs (LogQL)

```logql
# API requests per route (from the access log line)
sum by (route) (count_over_time({job="node_queue", service="node-queue-api"} | json | context="HTTP" [5m]))

# API p95 latency per route (ms)
quantile_over_time(0.95, {job="node_queue", service="node-queue-api"} | json | context="HTTP" | unwrap durationMs [5m]) by (route)

# API 5xx responses
sum(count_over_time({job="node_queue", service="node-queue-api"} | json | context="HTTP" | statusCode >= 500 [5m]))

# Errors per service
sum by (service) (count_over_time({job="node_queue", level="error"} [5m]))

# Follow one request end to end
{job="node_queue"} |= "<transactionId>"

# Rate-limited requests
sum(count_over_time({job="node_queue"} |= "Rate limit exceeded" [5m]))

# Daily stats cron ran in the last 25h (0 = it did not)
sum(count_over_time({job="node_queue", service="node-queue-cron"} |= "[CRON] dailyStats finished" [25h]))

# nginx 5xx per domain (502 = upstream process down)
sum by (host, status) (count_over_time({job="nginx", stream="access"} | json | status >= 500 [5m]))

# Crashes / raw stderr
{job="pm2"}
```

### Metrics (PromQL)

```promql
# Memory per service (MB)
namedprocess_namegroup_memory_bytes{memtype="resident"} / 1024 / 1024

# CPU per service (cores)
rate(namedprocess_namegroup_cpu_seconds_total[5m])

# Process restarted in the last 15 min (PM2 restart / crash loop)
changes(namedprocess_namegroup_oldest_start_time_seconds{groupname=~"node-queue-.*|qms-mpp-ui"}[15m]) > 0

# Service not running
namedprocess_namegroup_num_procs{groupname=~"node-queue-.*|qms-mpp-ui|postgres|redis-server|nginx"} == 0

# Host memory available (fraction)
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# Root disk used (fraction)
1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}

# Hours since the last successful DB backup
(time() - node_queue_db_backup_last_success_timestamp_seconds) / 3600

# Postgres / Redis up
pg_up
redis_up

# Postgres connections by state (max_connections is 100 by default)
sum by (state) (pg_stat_activity_count{datname="qms_prod"})

# Postgres longest running transaction (seconds)
max(pg_stat_activity_max_tx_duration{datname="qms_prod"})

# Postgres deadlocks
increase(pg_stat_database_deadlocks{datname="qms_prod"}[1h])

# Redis memory used (MB) and evictions
redis_memory_used_bytes / 1024 / 1024
rate(redis_evicted_keys_total[5m])

# TLS certificate days left (from Synthetic Monitoring checks)
(probe_ssl_earliest_cert_expiry - time()) / 86400
```

External services (S3, Google Text-to-Speech) have no metrics of their own; their failures are
logged by the API:

```logql
sum(count_over_time({job="node_queue", level="error"} |~ "(?i)s3|text.?to.?speech|tts" [15m]))
```

### Alerts in Grafana

The rules below live in Grafana in the **node_queue** folder (group `node_queue`, evaluated every
minute) and notify the Telegram contact point. Each rule has a templated `summary` (with the
current value), an `action` annotation (next step) and a `logs_query` annotation (LogQL) that the
template turns into a **📜 Logs** link to Grafana Explore, covering 15 min before the alert. Telegram messages use the template in
[`monitoring/telegram-alert.tmpl`](./monitoring/telegram-alert.tmpl) (Alerting → Contact points →
Notification templates `qms-telegram`; contact point message
`{{ template "qms.telegram.message" . }}`, parse mode HTML).

### Suggested alerts

| Alert | Condition | For |
| --- | --- | --- |
| API / websocket / UI down | Synthetic check failing | 2 checks |
| Service not running | `num_procs == 0` (query above) | 2m |
| Crash loop | restarts query `> 0` | 0m |
| API 5xx | 5xx count `> 5` in 5m | 5m |
| Daily stats cron missed | cron query `== 0` | — (evaluate hourly) |
| Low memory | available `< 0.15` | 10m |
| DB backup missed | hours since last backup `> 26` | — |
| DB backup failed | `node_queue_db_backup_success == 0` | 0m |
| Postgres / Redis down | `pg_up == 0` / `redis_up == 0` | 2m |
| Long transaction | longest transaction `> 300` s | 5m |
| TLS certificate expiring | days left `< 14` | 1h |
| S3 / TTS failing | external-service error count `> 3` in 15m | 0m |
| Disk filling | used `> 0.8` | 30m |
