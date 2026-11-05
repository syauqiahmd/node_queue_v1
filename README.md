# QMS Backend (node_queue)

Backend of the Queue Management System (QMS) used by Mall Pelayanan Publik Kab. Berau: REST API,
realtime events (Socket.IO and native WebSocket), voice announcements and scheduled jobs.
The frontend lives in [node_queue_v1_ui](https://github.com/syauqiahmd/node_queue_v1_ui).

**Documentation (product, architecture, API reference, deployment, operations):**
[QMS — Documentation on Notion](https://app.notion.com/p/40f52441ab0481e0b796d1a4b77ca84c)

## Features

- Tickets per organization and service: take, call, recall, resolve, prioritize
- Realtime updates for the staff dashboard and the queue monitor
- Voice announcements with Google Cloud Text-to-Speech, stored in S3-compatible storage
- Visitor registration and visit history, daily statistics, CSV reports
- Service-to-service (partner) API with per-service keys
- JWT auth with `ADMIN` / `USER` roles, rate limiting, Redis caching

## Tech stack

Node.js 22, Express, Prisma + PostgreSQL 16, Redis 7, Socket.IO + `ws`, node-cron, Awilix (DI),
Joi, Winston, Jest, ESLint + Prettier.

## Requirements

- Node.js 22.15.1 (`.nvmrc`; run `nvm use`)
- PostgreSQL 16
- Redis 7
- S3-compatible storage (MinIO/SeaweedFS locally, or a cloud bucket)
- Google Cloud service account with Text-to-Speech (for call sounds)

Postgres, Redis and SeaweedFS can be started from the Docker setup in [`deploy/docker/`](deploy/docker/).

## Getting started

```bash
git clone https://github.com/syauqiahmd/node_queue_v1.git
cd node_queue_v1
nvm use
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in the values
npx prisma migrate dev --schema src/infra/db/prisma/schema.prisma
```

Run each process in its own terminal:

```bash
npm run dev:api                  # API (REST + Socket.IO) on PORT, default 8000
npm run dev:cron                 # scheduled jobs
npm run start:websocket          # native WebSocket on WEBSOCKET_PORT, default 8080
```

Check http://localhost:8000/api/v1/health. Interactive API docs (Swagger UI): http://localhost:8000/docs.

Every environment variable is listed in `.env.example` and described in the documentation
(*Developer Guide → Environment Variables*).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:api` / `npm run dev:cron` | API / cron with auto-reload (nodemon) |
| `npm run start:api` / `start:cron` / `start:websocket` | Run a process without reload |
| `npm test` | Jest test suite |
| `npm run lint` / `npm run lint-fix` | ESLint |
| `npm run generate` | Generate the Prisma client |
| `npm run generate:service-key -- <name>` | New key for the partner API (`SERVICE_API_KEYS`) |
| `node scripts/backupDb.js` | Database backup (dump + private S3 copy + metrics) |
| `node scripts/downloadBackup.js [latest\|<file>]` | List or download backups from S3 |

A Husky pre-commit hook runs lint-staged and the test suite.

## Project structure

```
src/
├── server.js          API entry point
├── websocket.js       native WebSocket service entry point
├── jobs/cron.js       cron service entry point
├── api/               routes, controllers, middlewares, Joi validation, Swagger
├── core/              business logic (services, DTOs, interfaces)
└── infra/             Prisma (schema, migrations), Redis/S3 clients, sockets, logging
scripts/               backup and maintenance scripts
deploy/docker/         Docker Compose deployment (compose file, Dockerfiles, nginx, scripts)
deploy/monitoring/     Grafana dashboard, alert template, Alloy snippets
tests/                 Jest tests, mirroring src/
```

## Deployment

Production runs as a Docker Compose stack ([`deploy/docker/`](deploy/docker/)): API, cron,
websocket, UI (nginx), PostgreSQL, Redis and SeaweedFS. To update a running server:

```bash
cd ~/site
git -C qms-be pull --ff-only && git -C qms-ui pull --ff-only
docker compose up -d --build
```

First install, configuration, backups, monitoring and the regular-VPS (PM2) alternative are in
the documentation (*Deployment & Operations*).

## Contributing

Branch from `main`, keep commits focused, and open a pull request. The pre-commit hook must pass
(lint + tests). Update the Notion documentation when you change an endpoint, an environment
variable or the deployment.

## License

Proprietary. All rights reserved.
