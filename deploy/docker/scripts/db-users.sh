#!/bin/bash
# Creates/refreshes the Postgres users for DBeaver. Idempotent; run as the deploy user:
#   bash ~/site/scripts/db-users.sh
# Re-run after every full DB re-import (pg_restore --no-acl drops the grants).
#   qms_readonly   SELECT only (read-only transactions)      secrets/dbeaver-readonly.txt
#   qms_readwrite  SELECT/INSERT/UPDATE/DELETE, no DDL        secrets/dbeaver-readwrite.txt
# Both: 5 connections max, 60 s statement timeout. Schema changes stay with Prisma migrations.
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SITE"
DB=$(grep '^POSTGRES_DB=' .env | cut -d= -f2-); OWNER=$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)

password() {  # generated once, kept in secrets/ (600)
  local f="$SITE/secrets/$1"
  [ -s "$f" ] || (umask 077; openssl rand -hex 20 > "$f")
  cat "$f"
}
RO=$(password dbeaver-readonly.txt); RW=$(password dbeaver-readwrite.txt)

SQL=$(mktemp); trap 'shred -u "$SQL"' EXIT
cat > "$SQL" <<SQLX
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='qms_readonly') THEN CREATE ROLE qms_readonly LOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='qms_readwrite') THEN CREATE ROLE qms_readwrite LOGIN; END IF;
END \$\$;
ALTER ROLE qms_readonly  WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$RO' CONNECTION LIMIT 5;
ALTER ROLE qms_readwrite WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$RW' CONNECTION LIMIT 5;
ALTER ROLE qms_readonly  SET default_transaction_read_only = on;
ALTER ROLE qms_readonly  SET statement_timeout = '60s';
ALTER ROLE qms_readwrite SET statement_timeout = '60s';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE "$DB" TO qms_readonly, qms_readwrite;
GRANT USAGE ON SCHEMA public TO qms_readonly, qms_readwrite;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qms_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO qms_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qms_readwrite;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO qms_readwrite;
ALTER DEFAULT PRIVILEGES FOR ROLE "$OWNER" IN SCHEMA public GRANT SELECT ON TABLES TO qms_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE "$OWNER" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO qms_readwrite;
ALTER DEFAULT PRIVILEGES FOR ROLE "$OWNER" IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO qms_readwrite;
SQLX
docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$SQL"
echo "qms_readonly and qms_readwrite ready (passwords in secrets/dbeaver-readonly.txt, secrets/dbeaver-readwrite.txt)"
