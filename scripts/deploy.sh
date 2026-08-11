#!/bin/bash
# Automated Deployment Script for Sempoa SIP TC Pariaman on VPS
# Run this script as root on your Ubuntu 20.04 VPS.

set -e

echo "=== 1. Updating System Packages ==="
apt update && apt upgrade -y

echo "=== 2. Installing Docker & Docker Compose ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
  apt install -y docker-compose
fi

echo "=== 3. Cloning Project ==="
PROJECT_DIR="/opt/sempoa-sip"
if [ -d "$PROJECT_DIR" ]; then
  echo "Project directory already exists. Pulling latest changes..."
  cd "$PROJECT_DIR"
  git pull
else
  git clone https://github.com/sempoa/sempoa-sip-tc-pariaman.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

echo "=== 4. Setting up Environment Variables ==="
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "WARNING: Created default .env file. Please edit /opt/sempoa-sip/.env with production credentials."
fi

echo "=== 5. Running Production Docker Containers ==="
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up -d --build

echo "=== 6. Installing Certbot & Nginx ==="
apt install -y nginx certbot python3-certbot-nginx

echo "=== 7. Configuring Nginx Reverse Proxy ==="
NGINX_CONF="/etc/nginx/sites-available/sempoa_sip"
cat << 'EOF' > "$NGINX_CONF"
server {
    listen 80;
    server_name sempoasipariaman.com www.sempoasipariaman.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

if [ ! -f "/etc/nginx/sites-enabled/sempoa_sip" ]; then
  ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

rm -f /etc/nginx/sites-enabled/default || true

nginx -t
systemctl reload nginx

echo "=== 8. Obtaining SSL Certificate (Let's Encrypt) ==="
echo "Please run: certbot --nginx -d sempoasipariaman.com -d www.sempoasipariaman.com to enable HTTPS."

echo "=== Setup Completed ==="
