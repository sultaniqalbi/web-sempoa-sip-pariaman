#!/bin/bash
# VPS DNS Repair and Auto-Deployment Script for Sempoa SIP TC Pariaman
# Run this as root on your Ubuntu VPS.

set -e

echo "=== 1. Repairing DNS Configurations ==="
# Append Google public DNS to resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf
echo "DNS repaired. testing internet connection..."

if ping -c 2 google.com &> /dev/null; then
  echo "SUCCESS: Internet connection restored!"
else
  echo "ERROR: Network is still unreachable. Please verify VPS gateway settings."
  exit 1
fi

echo "=== 2. Updating System Packages ==="
apt update && apt upgrade -y

echo "=== 3. Installing Docker & Docker Compose ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  usermod -aG docker $USER
fi
if ! command -v docker-compose &> /dev/null; then
  apt install -y docker-compose
fi

echo "=== 4. Cloning Repository ==="
mkdir -p /opt/sempoa-sip
cd /opt/sempoa-sip
if [ -d ".git" ]; then
  git pull
else
  git clone https://github.com/sempoa/sempoa-sip-tc-pariaman.git .
fi

echo "=== 5. Auto-Generating Production .env ==="
DB_PASS=$(openssl rand -hex 16)
JWT_SEC=$(openssl rand -hex 32)

cat << EOF > .env
POSTGRES_USER=sempoa_prod
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=sempoa_sip
POSTGRES_HOST=db
POSTGRES_PORT=5432

FASTAPI_ENV=production
SECRET_KEY=${JWT_SEC}
ALLOWED_ORIGINS=["https://sempoasippariaman.com"]

ESP32_API_KEY=SempoaPariaman_ESP32_SecureKey_2026!
EOF

echo "Production configurations written."

echo "=== 6. Deploying Docker Containers ==="
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up -d --build

echo "=== 7. Setting up Nginx & SSL (Let's Encrypt) ==="
apt install -y nginx certbot python3-certbot-nginx

NGINX_CONF="/etc/nginx/sites-available/sempoa_sip"
cat << 'EOF' > "$NGINX_CONF"
server {
    listen 80;
    server_name sempoasippariaman.com www.sempoasippariaman.com;

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

echo "=== 8. Obtaining SSL (Let's Encrypt) ==="
certbot --nginx -d sempoasippariaman.com -d www.sempoasippariaman.com --non-interactive --agree-tos -m admin@sempoasippariaman.com

echo "=== 9. Endpoints Verification ==="
sleep 5
curl -H "X-API-Key: SempoaPariaman_ESP32_SecureKey_2026!" http://localhost:8000/api/ping

echo "=== PRODUCTION DEPLOYMENT COMPLETED SUCCESS ==="
