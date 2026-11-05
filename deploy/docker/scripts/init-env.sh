#!/usr/bin/env bash
# Creates the env/secret files for a fresh install. Never overwrites an existing file,
# so it is safe to re-run. Run from the deploy folder (e.g. ~/site): bash scripts/init-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077

rand() { openssl rand -hex "${1:-24}"; }
created() { echo "  created $1"; }

mkdir -p env secrets logs/backend backup-db
chmod 700 env secrets backup-db

# ---- .env : internal connections (read by docker compose) -------------------------
if [ ! -f .env ]; then
  cat > .env <<EOF
# Internal service credentials, injected into the backend containers by docker-compose.yml.
# Changing a password here after the first start also requires changing it inside the
# service (Postgres keeps the password it was initialised with).
POSTGRES_DB=qms_prod
POSTGRES_USER=qms
POSTGRES_PASSWORD=$(rand)

REDIS_PASSWORD=$(rand)

S3_BUCKET=qms-media
S3_ACCESS_KEY=qms-$(rand 8)
S3_SECRET_KEY=$(rand 32)
EOF
  created .env
fi
# shellcheck disable=SC1091
set -a; . ./.env; set +a

# ---- SeaweedFS S3 identities (generated from .env) --------------------------------
if [ ! -f secrets/seaweedfs-s3.json ]; then
  cat > secrets/seaweedfs-s3.json <<EOF
{
  "identities": [
    {
      "name": "qms-app",
      "credentials": [{ "accessKey": "${S3_ACCESS_KEY}", "secretKey": "${S3_SECRET_KEY}" }],
      "actions": ["Admin", "Read", "List", "Tagging", "Write"]
    }
  ]
}
EOF
  chmod 644 secrets/seaweedfs-s3.json   # read by the seaweedfs container
  created secrets/seaweedfs-s3.json
fi

# ---- env/backend.env : application settings ---------------------------------------
if [ ! -f env/backend.env ]; then
  cat > env/backend.env <<EOF
# Backend (api / cron / websocket) application settings.
# DB, Redis, S3 endpoint/keys and ports are set in docker-compose.yml from ../.env.
# Apply changes with:  docker compose up -d api cron websocket

NODE_ENV=production
TZ=Asia/Makassar

# TODO: set to the public UI origin(s) once the domain is known, comma-separated
CORS_ORIGIN=
# TODO: public URL, e.g. https://qms.example.go.id (Swagger docs)
PRODUCTION_HOST=
# TODO: public base URL of the audio files, e.g. https://qms.example.go.id/qms-media
S3_PUBLIC_URL=

# Logging
LOG_LEVEL=info
LOG_CONSOLE_LEVEL=warn
PRISMA_SLOW_QUERY_MS=500
SHUTDOWN_TIMEOUT_MS=5000

# Security (temporary random values: replace with the production ones if users/tokens must carry over)
JWT_SECRET=$(rand 32)
JWT_EXPIRES_IN=6h
BCRYPT_SALT_ROUNDS=12
MASTER_PASSWORD=$(rand 16)
# TODO: name:key pairs for /private routes
SERVICE_API_KEYS=

# Rate limiting (minutes)
RATE_LIMIT_WINDOW=5
RATE_LIMIT_MAX=100
PUBLIC_RATE_LIMIT_WINDOW=1
PUBLIC_RATE_LIMIT_MAX=10

# Google Text-to-Speech: put the service-account JSON at secrets/google-tts.json
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/google-tts.json

# S3 extras
S3_SOUND_EXPIRATION_HOURS=8

# Cron schedules
PRE_CALCULATE_TIME=0 21 * * *
HOUSEKEEPING_TIME_QUEUE_DATA=0 22 * * 0
HOUSEKEEPING_TIME_S3_FILES=0 23 * * *
EOF
  created env/backend.env
fi

# ---- env/ui.env : baked into the UI at build time ---------------------------------
if [ ! -f env/ui.env ]; then
  cat > env/ui.env <<'EOF'
# UI build-time settings (Vite). Apply with:  docker compose up -d --build web
# API and WebSocket go through the same origin (nginx), so the URLs can stay unset:
#   API -> /api          WebSocket -> ws(s)://<origin>/
# VITE_API_BASE_URL=
# VITE_WS_URL=

VITE_TIMEZONE=Asia/Makassar
VITE_MONITOR_TITLE=Nama Instansi Anda
# VITE_REQUIRE_VISITOR_DATA=true
# VITE_MONITOR_SHOW_SERVICE=true
# VITE_TICKET_SHOW_SERVICE_NAME=true
# VITE_RECTA_PRINTER_ID=
# VITE_RECTA_PROFILE=
# VITE_FARO_URL=
EOF
  chmod 600 env/ui.env
  created env/ui.env
fi

# ---- data volumes (external in docker-compose.yml, so `down -v` can't delete them) ------
for v in qms_pgdata qms_redisdata qms_s3data; do
  docker volume inspect "$v" >/dev/null 2>&1 || { docker volume create "$v" >/dev/null && created "volume $v"; }
done

echo "env ready. Fill the TODOs in env/backend.env and add secrets/google-tts.json."
