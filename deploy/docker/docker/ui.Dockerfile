# syntax=docker/dockerfile:1
# UI image (node-queue-ui): Vite build served by nginx, which is also the reverse proxy.

FROM node:22.15.1-bookworm AS build
WORKDIR /app
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# VITE_* values are baked into the bundle at build time: edit env/ui.env, then rebuild `web`.
COPY --from=env ui.env .env.production
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx.conf is bind-mounted by docker-compose so routing can change without a rebuild.
