#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 SEMPOA SIP PARIAMAN - AUTOMATED VPS PRODUCTION DEPLOY"
echo "=========================================================="

DOMAIN="sempoasipariaman.com"
WWW_DOMAIN="www.sempoasipariaman.com"
EMAIL="admin@sempoasipariaman.com"

# 1. Update and install prerequisites
echo "📦 Updating system packages..."
apt-get update && apt-get install -y curl git ufw certbot

# 2. Install Docker & Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo "🐳 Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
fi

# 3. Configure Firewall (UFW)
echo "🔒 Configuring firewall ports (SSH: 22, HTTP: 80, HTTPS: 443)..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Generate SSL Certificate with Certbot Standalone (if not already issued)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "🔐 Obtaining Let's Encrypt SSL Certificate for $DOMAIN and $WWW_DOMAIN..."
    # Stop any conflicting service on port 80
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    systemctl stop nginx 2>/dev/null || true
    
    certbot certonly --standalone \
        -d $DOMAIN -d $WWW_DOMAIN \
        --non-interactive --agree-tos \
        --email $EMAIL \
        --preferred-challenges http
    echo "✅ SSL Certificate successfully obtained!"
else
    echo "✅ SSL Certificate already exists for $DOMAIN."
fi

# 5. Setup production .env file if not exists
if [ ! -f ".env" ]; then
    echo "📝 Generating production .env file..."
    RANDOM_SECRET=$(openssl rand -hex 32)
    RANDOM_DB_PASS=$(openssl rand -hex 16)
    
    cat <<EOF > .env
POSTGRES_USER=sempoa_prod
POSTGRES_PASSWORD=${RANDOM_DB_PASS}
POSTGRES_DB=sempoa_sip
POSTGRES_HOST=db
POSTGRES_PORT=5432

FASTAPI_ENV=production
SECRET_KEY=${RANDOM_SECRET}
ALLOWED_ORIGINS=https://${DOMAIN},https://${WWW_DOMAIN},http://202.155.157.22,https://202.155.157.22
ESP32_API_KEY=SempoaPariaman_ESP32_SecureKey_2026!
EOF
    echo "✅ Production .env created with secure random keys."
fi

# 6. Ensure required directories exist
mkdir -p backend/app/uploads/galeri backend/app/uploads/profil backend/app/uploads/bukti_transfer backend/backups /var/www/certbot

# 7. Build and start containers
echo "🚀 Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build

echo "=========================================================="
echo "🎉 DEPLOYMENT SELESAI!"
echo "Website sudah aktif dan live di:"
echo "👉 https://$DOMAIN"
echo "👉 https://$WWW_DOMAIN"
echo "=========================================================="
docker compose -f docker-compose.prod.yml ps
