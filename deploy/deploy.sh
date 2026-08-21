#!/usr/bin/env bash
# One-shot deploy for Devine on an Ubuntu droplet (domain: devinefoodproducts.com).
# Prereq: backend/.env and backend/keys/*.pem must already be uploaded (see DEPLOY.md).
# Run as root:  bash deploy/deploy.sh
set -euo pipefail

DOMAIN="devinefoodproducts.com"
APP_DIR="/var/www/devine"
REPO="https://github.com/nexoventlabs-official/Devine.git"
LETSENCRYPT_EMAIL="admin@${DOMAIN}"

echo "== 1/7 Prerequisites =="
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y nginx git
npm i -g pm2 >/dev/null 2>&1 || npm i -g pm2

echo "== 2/7 Clone / update repo =="
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git fetch origin && git reset --hard origin/main
else
  mkdir -p /var/www && git clone "$REPO" "$APP_DIR"
fi

echo "== 3/7 Backend =="
cd "$APP_DIR/backend"
if [ ! -f .env ]; then
  echo "!! backend/.env is missing. Upload it first (scp) then re-run. Aborting."; exit 1
fi
if [ ! -f keys/flow_private.pem ]; then
  echo "!! backend/keys/*.pem missing — WhatsApp Flows won't decrypt. Upload keys/ then re-run."; exit 1
fi
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "== 4/7 Frontend build =="
cd "$APP_DIR/frontend"
if [ ! -f .env ]; then
  printf 'VITE_SERVER_ORIGIN=https://%s\nVITE_API_BASE_URL=https://%s/api\n' "$DOMAIN" "$DOMAIN" > .env
fi
npm ci 2>/dev/null || npm install
npm run build

echo "== 5/7 Nginx =="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/devine
ln -sf /etc/nginx/sites-available/devine /etc/nginx/sites-enabled/devine
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "== 6/7 Backend process (pm2) =="
cd "$APP_DIR/backend"
pm2 delete devine-api >/dev/null 2>&1 || true
pm2 start server.js --name devine-api
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "== 7/7 HTTPS (Let's Encrypt) =="
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" --redirect \
  || echo "certbot failed — run manually: certbot --nginx -d $DOMAIN -d www.$DOMAIN"

echo ""
echo "== DONE =="
echo "Site:     https://$DOMAIN"
echo "API:      https://$DOMAIN/api/health"
echo "Webhook:  https://$DOMAIN/api/whatsapp/webhook  (verify token from backend/.env)"
echo "Next: in Meta set the webhook callback + flow endpoints to https://$DOMAIN, then run:"
echo "      cd $APP_DIR/backend && node scripts/publishFlows.js"
