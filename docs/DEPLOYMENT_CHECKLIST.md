# Step-by-Step Production Deployment Guide

Guide to deploying the Sempoa SIP TC Pariaman application to a Linux Ubuntu VPS with HTTPS.

---

## 1. Domain Nameserver Configurations
1. Log in to your domain registrar (e.g. Niagahoster, GoDaddy).
2. Set DNS Records:
   - Type `A`, Host `@`, Value `<VPS-IP-ADDRESS>`
   - Type `CNAME`, Host `www`, Value `sempoasipariaman.com.`
3. Verify DNS resolution:
   ```bash
   ping sempoasipariaman.com
   ```

---

## 2. VPS System Initialization
Update and install prerequisites (Docker and Nginx) on your VPS:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

Install Docker Engine and Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## 3. Clone Repository and Configure Envs
1. Clone the project repository onto your VPS:
   ```bash
   git clone https://github.com/sempoa/sempoa-sip-tc-pariaman.git /app/sempoa-sip-tc-pariaman
   cd /app/sempoa-sip-tc-pariaman
   ```
2. Create `.env` from production template:
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   *Change `POSTGRES_PASSWORD`, `SECRET_KEY`, and update domains to production values.*

---

## 4. Run Docker Container in Production Mode
1. Build and run containers in background:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
2. Verify service container statuses:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

---

## 5. SSL & Nginx Reverse Proxy Setup
1. Request Let's Encrypt SSL certificates:
   ```bash
   sudo certbot --nginx -d sempoasipariaman.com -d www.sempoasipariaman.com
   ```
2. Configure Nginx virtual host at `/etc/nginx/sites-available/sempoa_sip`:
   ```nginx
   server {
       server_name sempoasipariaman.com www.sempoasipariaman.com;

       location / {
           proxy_pass http://localhost:80; # Frontend Docker port
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /api {
           proxy_pass http://localhost:8000; # Backend FastAPI port
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Enable site and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sempoa_sip /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
