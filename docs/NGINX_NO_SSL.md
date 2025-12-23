# Nginx Setup (No SSL)

Use these configs to run UI, API, and WebSocket on HTTP only. SSL can be added later without changing upstream ports.

## DNS

- A `qms-mpp.web.id` → `<vps_ip>`
- A `api.qms-mpp.web.id` → `<vps_ip>`
- A `ws.qms-mpp.web.id` → `<vps_ip>`

## Upstreams

Create `/etc/nginx/conf.d/node_queue_upstreams.conf`:

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

upstream node_queue_api { server 127.0.0.1:8000; }
upstream node_queue_ws  { server 127.0.0.1:8080; }
upstream node_queue_ui  { server 127.0.0.1:13001; }
```

## UI Site (qms-mpp.web.id)

Create `/etc/nginx/sites-available/qms-mpp.web.id.conf`:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name qms-mpp.web.id www.qms-mpp.web.id;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-XSS-Protection "1; mode=block" always;

  gzip on;

  location / {
    proxy_pass http://node_queue_ui;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## API Site (api.qms-mpp.web.id)

Create `/etc/nginx/sites-available/api.qms-mpp.web.id.conf`:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name api.qms-mpp.web.id;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-XSS-Protection "1; mode=block" always;

  gzip on;

  location / {
    proxy_pass http://node_queue_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Socket.IO (API-integrated websocket on /socket.io)
  location /socket.io/ {
    proxy_pass http://node_queue_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 60s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## WebSocket Site (ws.qms-mpp.web.id)

Create `/etc/nginx/sites-available/ws.qms-mpp.web.id.conf`:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name ws.qms-mpp.web.id;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-XSS-Protection "1; mode=block" always;

  location / {
    proxy_pass http://node_queue_ws;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 60s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/qms-mpp.web.id.conf /etc/nginx/sites-enabled/qms-mpp.web.id.conf
sudo ln -s /etc/nginx/sites-available/api.qms-mpp.web.id.conf /etc/nginx/sites-enabled/api.qms-mpp.web.id.conf
sudo ln -s /etc/nginx/sites-available/ws.qms-mpp.web.id.conf /etc/nginx/sites-enabled/ws.qms-mpp.web.id.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Later: Add SSL

When ready, issue certs and update the site files to add 443 `ssl http2` servers. You can use the full examples in `VPS_SETUP.md` and run Certbot with all domains.
