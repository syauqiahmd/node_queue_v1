# VPS Migration Checklist (node_queue API + node-queue-ui)

Moving both `node_queue` (API/websocket/cron) and `node-queue-ui` (Vue SPA) to a new VPS with a new domain. Pairs with `docs/VPS_SETUP.md`, which covers the new box's base setup in detail — this document covers what's specific to a *migration*: what state needs to move, what's safe to leave behind, and the order of operations.

---

## 1. Check current VPS specs

Run these on the **current** VPS via SSH before provisioning the new one, so it's sized at least as large.

```bash
# CPU
lscpu | grep -E "Model name|^CPU\(s\)|Thread|Core"
nproc

# RAM
free -h

# Disk
df -h
lsblk

# OS / kernel
lsb_release -a
uname -a

# Public IP
curl -4 ifconfig.me

# What's actually listening (ports/services)
sudo ss -tulpen

# Installed runtime versions
node -v; npm -v; pm2 -v; nginx -v; psql --version; redis-cli --version; certbot --version

# Current load / resource usage
htop            # interactive, ctrl+c to exit
pm2 status
pm2 describe node-queue-api   # per-process memory/CPU if using PM2 like docs/VPS_SETUP.md

# Postgres size (how much data you'll be moving)
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('<db_name>'));"

# Disk usage breakdown if you're not sure what's eating space
sudo du -sh /home/deploy/apps/* /var/log/* /var/lib/postgresql 2>/dev/null | sort -rh | head -20
```

---

## 2. Migration checklist

Grounded in what's actually in these repos right now: Postgres (local to the VPS), Redis (local), external S3-compatible storage (`is3.cloudhost.id` — not hosted on the VPS, so it isn't part of the migration, just its credentials), Google TTS via a local `credentials.json`, PM2 running 3 processes (api, websocket, ui `serve`), Nginx fronting 3 subdomains + Let's Encrypt (per `docs/VPS_SETUP.md`).

### A. Inventory / secrets audit (do first, on the old box)

- [ ] `.env` (backend) — gitignored, won't come from `git clone`. Copy securely (`scp`, not Slack/email).
- [ ] `src/infra/configs/credentials.json` (Google TTS service account) — also gitignored, copy securely.
- [ ] UI's `.env.production` (or whatever env file it builds with) — note current `VITE_API_BASE_URL`/`VITE_WS_URL` values; these get **rebaked at build time**, not runtime, so they must be updated to the new domain *before* `npm run build` on the new server.
- [ ] Note current `SERVICE_API_KEYS` values if any partner services are integrated — they'll need the new domain communicated to them, key values themselves don't need to change.
- [ ] S3/Google credentials themselves don't need migrating (external services) — just need to carry the same values over.

### B. New VPS bootstrap

- [ ] Provision new VPS, sized ≥ current spec from section 1.
- [ ] Follow `docs/VPS_SETUP.md` sections 1–3 (SSH hardening, Node 20, PM2, firewall) as-is.
- [ ] Install Postgres and Redis on the new box (that doc doesn't cover their install — add `sudo apt install postgresql redis-server` and configure `pg_hba.conf`/auth to match the current setup).
- [ ] Don't touch DNS yet.

### C. Data migration (the part that actually matters — this is real business data)

- [ ] **Postgres**: on the old VPS, `pg_dump --format=custom "postgresql://<user>:<pass>@localhost:5432/<db>" -f backup.dump`; `scp` to the new VPS; `pg_restore --create --clean -d postgres backup.dump`.
- [ ] **Redis**: no migration needed — it's only used for session/token caching and rate-limit counters (ephemeral), safe to start empty on the new box. Anyone with an active session just re-logs in.
- [ ] Uploaded ticket-call audio lives on external S3 (`is3.cloudhost.id`), not on the VPS disk — nothing to move there either.
- [ ] Copy `.env` and `credentials.json` onto the new VPS (from section A), update `DATABASE_URL`/`REDIS_HOST` to point at the new box's local instances.

### D. Deploy code

- [ ] `git clone` both repos onto the new VPS.
- [ ] Backend: `npm ci`, `npx prisma generate`, `npx prisma migrate deploy` (against the restored DB — should be a no-op if the dump already matches current schema, but run it to be safe).
- [ ] Add a `connection_limit` to the new `DATABASE_URL` sized for the new box's core count (see the connection-pool sizing discussion in this project's conversation history / commit notes if you need the reasoning again).
- [ ] UI: update `.env.production` with the **new** API/WS domains, then `npm run build` on the new server (or in CI) — don't copy the old `dist/` folder over, it has the old domain baked in.
- [ ] Set up PM2 (`ecosystem.config.js` per `docs/VPS_SETUP.md`), `pm2 start`, `pm2 save`, `pm2 startup`.

### E. Nginx + new domain + SSL

- [ ] Point the new domain's DNS `A` records (apex/UI, `api.`, `ws.`) at the **new** VPS IP — do this early since DNS propagation takes time, but don't cut traffic over yet if you're keeping the old box live in parallel.
- [ ] Adapt the Nginx site configs from `docs/VPS_SETUP.md` (search/replace the old domain → new domain).
- [ ] `sudo certbot --nginx -d <domain> -d api.<domain> -d ws.<domain> ...`, `sudo nginx -t`, reload.

### F. Cron

- [ ] `src/jobs/cron.js` runs as its own process — make sure it's actually started on the new VPS (it's not in the `ecosystem.json` currently checked into this repo, so check however cron is currently run: separate PM2 entry, systemd timer, or plain `crontab`).

### G. Verify before cutover

- [ ] `pm2 logs node-queue-api` on first boot — the app's own `healthCheck.runChecks()` (`src/infra/utils/healthCheck.js`) checks DB, Redis, and S3 connectivity at startup and **exits the process if any fail**, so a clean boot is a real smoke test, not just "the process is running."
- [ ] Hit the new domain directly (before flipping any traffic that matters): `curl -I https://api.<newdomain>/api/v1/private/ping` with a valid `X-Service-Key`, load the UI, confirm the monitor/ticket pages connect over the new `wss://ws.<newdomain>`.
- [ ] Confirm `SERVICE_API_KEYS` still work for any partner integration, and that partner services have been told about the new base URL.

### H. Cutover + rollback

- [ ] Lower DNS TTL a day or two ahead of the switch if not already low, so a rollback (pointing DNS back at the old VPS) is fast if something's wrong.
- [ ] Keep the old VPS running (don't destroy it) for a few days after cutover, DB dump included, as the rollback path.
- [ ] Once stable, decommission the old VPS.
