# syntax=docker/dockerfile:1
# Backend image (node_queue). One image, run as api / cron / websocket / migrate.

# ---- build: install deps + generate Prisma client -------------------------------
FROM node:22.15.1-bookworm AS build
WORKDIR /app
ENV HUSKY=0
COPY package.json package-lock.json ./
COPY src/infra/db/prisma ./src/infra/db/prisma
# Full install: the prisma CLI (devDependency) is needed by the migrate service.
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run generate
# Signing key for the PostgreSQL apt repo (pg_dump 16 for scripts/backupDb.js; Debian ships 15).
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /pgdg.asc

# ---- runtime ---------------------------------------------------------------------
FROM node:22.15.1-bookworm-slim
# The slim image has no CA bundle or OpenSSL (Prisma needs libssl). The host firewall only
# lets containers out on 443, so apt is switched to HTTPS using the CA bundle from the build stage.
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /pgdg.asc /usr/share/keyrings/pgdg.asc
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
 && echo "deb [signed-by=/usr/share/keyrings/pgdg.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini postgresql-client-16 \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    # The host firewall drops IPv6; prefer IPv4 so Google/S3 calls don't stall on AAAA records.
    NODE_OPTIONS=--dns-result-order=ipv4first
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/logs && chown node:node /app/logs
USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/server.js"]
