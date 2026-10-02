# VPS Setup Guide (Ubuntu 22.04 LTS)

This guide covers a complete, production‑ready setup for a Node.js application behind Nginx with PM2 process management, SSL via Let's Encrypt, firewall hardening, and service monitoring. Replace placeholders like `<your_domain>`, `<app_port>`, and `<your_email>` accordingly.

## 1. Initial Setup

### SSH Access Configuration

```bash
# Connect as root (or provider-supplied user)
ssh root@<server_ip>

# Create a non-root user and grant sudo
adduser deploy
usermod -aG sudo deploy

# Add SSH key for the new user on your local machine
ssh-copy-id deploy@<server_ip>

# Harden SSH
sudo nano /etc/ssh/sshd_config
# Recommended changes:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# MaxAuthTries 3
# AllowUsers deploy

sudo systemctl restart ssh
```

### System Updates and Essential Packages

```bash
sudo apt update && sudo apt -y upgrade
sudo apt install -y build-essential curl git ufw unzip jq htop \
  ca-certificates software-properties-common apt-transport-https \
  fail2ban unattended-upgrades

# Enable unattended security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Firewall Configuration (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP (Nginx)
sudo ufw allow 443/tcp   # HTTPS (Nginx)
# Optional: allow app port if direct access needed (usually proxied via Nginx)
# sudo ufw allow <app_port>/tcp
sudo ufw enable
sudo ufw status verbose
```

### Timezone and Locale Settings

```bash
sudo timedatectl set-timezone Asia/Jakarta   # choose your timezone
timedatectl

sudo apt install -y tzdata locales
sudo dpkg-reconfigure tzdata
sudo locale-gen en_US.UTF-8
sudo update-locale LANG=en_US.UTF-8
echo $LANG
```

## 2. Node.js Environment

### Node.js Installation (v20.x)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # v20.x
npm -v
```

### NPM/Yarn Setup

```bash
# Optional: enable corepack and Yarn
sudo corepack enable
sudo npm install -g yarn
yarn -v
```

### Global Packages

```bash
sudo npm install -g pm2 npm-check-updates
# Optional tooling
sudo npm install -g typescript ts-node
```

## 3. PM2 Configuration

### PM2 Installation and Setup

```bash
sudo npm install -g pm2
pm2 -v
```

### Process Management Configuration

Create an ecosystem file for your app:

```bash
mkdir -p ~/apps/<your_app>
cd ~/apps/<your_app>

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'node-queue-api',
      script: 'src/server.js',
      cwd: '/home/deploy/apps/<your_app>',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: '8000',
        // Example envs (set in /etc/environment or PM2 env)
        JWT_SECRET: 'change-me',
        JWT_EXPIRES_IN: '6h',
      },
    },
    {
      name: 'node-queue-websocket',
      script: 'src/websocket.js',
      cwd: '/home/deploy/apps/<your_app>',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: '8080',
      },
    },
    {
      name: 'node-ui',
      script: 'serve',
      args: ['-s', '/home/deploy/apps/<your_ui_app>/dist', '-l', '13001'],
      cwd: '/home/deploy/apps/<your_ui_app>',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
EOF

# Start and save
pm2 start ecosystem.config.js
pm2 status
pm2 save
```

#### Vue.js UI Build and Serve

```bash
# On the VPS (or CI), prepare the UI app directory
mkdir -p /home/deploy/apps/<your_ui_app>
cd /home/deploy/apps/<your_ui_app>

# Pull your Vue project (e.g., via git) and install deps
npm ci

# Build production assets
npm run build

# The ecosystem above runs: serve -s /home/deploy/apps/<your_ui_app>/dist -l 13001
pm2 restart node-ui
pm2 save
```

### Startup Script Generation

```bash
sudo pm2 startup systemd -u deploy --hp /home/deploy
# Follow PM2 instructions, then:
pm2 save
```

### Log Rotation Settings

Both log sources keep the **last 30 days**. This uses the system `logrotate` (already run daily by
`logrotate.timer`) and cron instead of the `pm2-logrotate` module, which would be one more Node
process on a 2 GB box.

**PM2 stdout/stderr** (`~/.pm2/logs`) - `/etc/logrotate.d/pm2-<user>`:

```
/home/<user>/.pm2/logs/*.log {
    su <user> <user>
    daily
    rotate 30
    maxage 30
    dateext
    dateformat -%Y-%m-%d
    compress
    delaycompress
    copytruncate   # PM2 keeps the file open, so copy then truncate instead of moving it
    missingok
    notifempty
}
```

Check it with `sudo logrotate -d /etc/logrotate.d/pm2-<user>` (dry run).

**App log files** (`<app>/logs/{error,warn,info,debug}`) - winston deletes files older than 30 days
itself (`maxFiles` in `log.helper.js`), but that only covers files tracked by the process that
created them, and the API, cron and websocket processes share these folders. A daily cron job is
the reliable backstop (`crontab -e`):

```
15 3 * * * find /home/<user>/sites/node_queue_v1/logs -type f \( -name "*.log" -o -name "*.log.gz" \) -mtime +30 -delete  # node_queue: keep 30 days of app logs
```

## 4. Nginx Configuration

### Nginx Installation

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
nginx -v
```

### Basic Security Hardening (Main Configuration)

Main config: `/etc/nginx/nginx.conf`

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
  worker_connections 1024;
  multi_accept on;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  server_tokens off;               # hide Nginx version
  client_max_body_size 10m;        # limit upload size
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  gzip on;
  gzip_comp_level 5;
  gzip_min_length 256;
  gzip_vary on;
  gzip_types text/plain text/css application/json application/javascript \
             text/xml application/xml application/xml+rss text/javascript;

  # SSL params for sites using HTTPS (referenced in site configs)
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;

  # Proxy defaults (can be overridden per server)
  proxy_read_timeout 60s;
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  include /etc/nginx/conf.d/*.conf;
  include /etc/nginx/sites-enabled/*;
}
```

### Configure Subdomains (DNS)

- Create DNS records pointing to your VPS IP:
  - `A @ -> <vps_ip>` for apex domain `qms-mpp.web.id` (UI)
  - `A api -> <vps_ip>` for `api.qms-mpp.web.id` (API)
  - `A ws -> <vps_ip>` for `ws.qms-mpp.web.id` (WebSocket)
  - Optionally `A www -> <vps_ip>` if you want `www.qms-mpp.web.id`

### Site-Specific Configuration (Reverse Proxy)

Create three site configs:

- `/etc/nginx/sites-available/qms-mpp.web.id.conf`
- `/etc/nginx/sites-available/api.qms-mpp.web.id.conf`
- `/etc/nginx/sites-available/ws.qms-mpp.web.id.conf`

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# Upstreams
upstream node_queue_api { server 127.0.0.1:8000; }
upstream node_queue_ws  { server 127.0.0.1:8080; }
upstream node_queue_ui  { server 127.0.0.1:13001; }

# 1) UI – qms-mpp.web.id
server {
  listen 80;
  listen [::]:80;
  server_name qms-mpp.web.id www.qms-mpp.web.id;
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name qms-mpp.web.id www.qms-mpp.web.id;

  ssl_certificate /etc/letsencrypt/live/qms-mpp.web.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/qms-mpp.web.id/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/qms-mpp.web.id/chain.pem;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Content-Security-Policy "default-src 'self'" always;

  gzip on;

  # Reverse proxy UI (port 13001)
  location / {
    proxy_pass http://node_queue_ui;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Alternative: serve Vue build directly from Nginx (no PM2/serve)
  # Uncomment and set correct path if you prefer static serving:
  # root /var/www/qms-mpp.web.id;
  # index index.html;
  # location / {
  #   try_files $uri $uri/ /index.html;
  # }
}

# 2) API – api.qms-mpp.web.id
server {
  listen 80;
  listen [::]:80;
  server_name api.qms-mpp.web.id;
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name api.qms-mpp.web.id;

  ssl_certificate /etc/letsencrypt/live/api.qms-mpp.web.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.qms-mpp.web.id/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/api.qms-mpp.web.id/chain.pem;

  add_header Strict-Transport-Security "max-age=31536000" always;
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
}

# 3) WebSocket – ws.qms-mpp.web.id
server {
  listen 80;
  listen [::]:80;
  server_name ws.qms-mpp.web.id;
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ws.qms-mpp.web.id;

  ssl_certificate /etc/letsencrypt/live/ws.qms-mpp.web.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/ws.qms-mpp.web.id/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/ws.qms-mpp.web.id/chain.pem;

  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # WebSocket proxy
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

Enable sites and test:

```bash
sudo ln -s /etc/nginx/sites-available/qms-mpp.web.id.conf /etc/nginx/sites-enabled/qms-mpp.web.id.conf
sudo ln -s /etc/nginx/sites-available/api.qms-mpp.web.id.conf /etc/nginx/sites-enabled/api.qms-mpp.web.id.conf
sudo ln -s /etc/nginx/sites-available/ws.qms-mpp.web.id.conf /etc/nginx/sites-enabled/ws.qms-mpp.web.id.conf
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain certs for all domains
sudo certbot --nginx \
  -d qms-mpp.web.id -d www.qms-mpp.web.id \
  -d api.qms-mpp.web.id \
  -d ws.qms-mpp.web.id \
  --email <your_email> --agree-tos --redirect

# Test auto renewal
sudo certbot renew --dry-run
```

### Performance Optimization Notes

- Enable HTTP/2 (already in `listen 443 ssl http2`).
- Use `worker_processes auto;` and tune `worker_connections` based on traffic.
- Consider caching static assets and setting proper cache headers.
- Tune proxy timeouts if your app performs long requests.

## 5. Service Management

### Systemd Service Files (Alternative to PM2)

Example systemd unit if you choose not to use PM2:

```ini
# /etc/systemd/system/node-queue-api.service
[Unit]
Description=Node Queue API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/apps/<your_app>
Environment="NODE_ENV=production" "PORT=<app_port>"
ExecStart=/usr/bin/node /home/deploy/apps/<your_app>/src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable node-queue-api
sudo systemctl start node-queue-api
sudo systemctl status node-queue-api
```

### Monitoring Setup

```bash
# PM2 built-in
pm2 monit
pm2 logs

# Fail2ban (SSH protection)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status

# Optional: install node_exporter (Prometheus) or Netdata for richer metrics
```

### Backup Procedures

```bash
# Example: PostgreSQL database backup (adjust credentials)
pg_dump "postgresql://<user>:<password>@localhost:5432/<db_name>" > /var/backups/<db_name>_$(date +%F).sql

# Redis snapshot copy (if used)
sudo cp /var/lib/redis/dump.rdb /var/backups/redis_dump_$(date +%F).rdb

# Nginx config and SSL certs
sudo tar czf /var/backups/nginx_configs_$(date +%F).tar.gz /etc/nginx
sudo tar czf /var/backups/letsencrypt_$(date +%F).tar.gz /etc/letsencrypt

# Crontab entries
sudo crontab -e
# Add lines like:
# 0 3 * * * pg_dump "postgresql://<user>:<password>@localhost:5432/<db_name>" > /var/backups/<db_name>_$(date +\%F).sql
# 0 4 * * 0 tar czf /var/backups/nginx_configs_$(date +\%F).tar.gz /etc/nginx
```

## 6. Final Checks

### Service Status Verification

```bash
systemctl status nginx
systemctl status node-queue-api   # if using systemd
pm2 status                        # if using PM2
nginx -t
```

### Port Accessibility Testing

```bash
ss -tulpen | grep -E ":(80|443|8000|8080|13001)"
curl -I http://qms-mpp.web.id
curl -I https://qms-mpp.web.id
curl -I https://api.qms-mpp.web.id
curl -I https://ws.qms-mpp.web.id
```

### Security Audit Recommendations

```bash
sudo ufw status verbose
sudo fail2ban-client status

# Review SSH hardening
sudo grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|MaxAuthTries)" /etc/ssh/sshd_config

# Optional: install Lynis for a system audit
sudo apt install -y lynis
sudo lynis audit system
```

## Notes & Pitfalls

- Point DNS for `<your_domain>` to the VPS public IP before running Certbot.
- Open ports 80 and 443 on the VPS firewall and any cloud firewalls (e.g., provider security groups).
- Keep secrets out of the repo—store sensitive values in environment variables or a secrets manager.
- Use `pm2 save` after any process changes; `pm2 startup` must be executed once per user.
- Always run `nginx -t` before reloading Nginx.
