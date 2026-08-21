# Deploy Devine to the droplet (devinefoodproducts.com → 168.144.180.123)

DNS: A records for `@` and `www` → `168.144.180.123` (already done).

## 1. Upload the secret files (from your Windows PC)

`.env` files and the flow keys are gitignored, so they are NOT in the repo — upload them once:

```powershell
# from c:\Users\Admin\Desktop\FMCG
ssh root@168.144.180.123 "mkdir -p /var/www/devine/backend/keys"
scp backend\.env            root@168.144.180.123:/var/www/devine/backend/.env
scp frontend\.env           root@168.144.180.123:/var/www/devine/frontend/.env
scp backend\keys\flow_private.pem root@168.144.180.123:/var/www/devine/backend/keys/
scp backend\keys\flow_public.pem  root@168.144.180.123:/var/www/devine/backend/keys/
```
(If `/var/www/devine` doesn't exist yet, run the git clone in step 2 first, then upload.)

## 2. Run the deploy script (on the droplet)

```bash
ssh root@168.144.180.123
mkdir -p /var/www && git clone https://github.com/nexoventlabs-official/Devine.git /var/www/devine 2>/dev/null || true
# (now upload .env + keys from step 1 if not done)
bash /var/www/devine/deploy/deploy.sh
```

The script installs Node/Nginx/PM2, builds the frontend, starts the API with PM2, configures Nginx, and gets a Let's Encrypt certificate.

## 3. Point Meta at the new domain

- Webhook callback URL: `https://devinefoodproducts.com/api/whatsapp/webhook`
- Verify token: value of `WA_VERIFY_TOKEN` in `backend/.env`
- Re-publish flows so their endpoint points here:
  ```bash
  cd /var/www/devine/backend && node scripts/publishFlows.js
  ```

## Redeploy after code changes
```bash
bash /var/www/devine/deploy/deploy.sh
```

## Old project / DB cleanup (do before first deploy if the box has an old app)
```bash
pm2 ls; ls -la /var/www            # see what's running
mongosh --quiet --eval 'db.adminCommand("listDatabases")'
mongodump --db <olddb> --out /root/backup-$(date +%F)   # backup first
mongosh --quiet --eval 'db.getSiblingDB("<olddb>").dropDatabase()'
pm2 delete <old-app>; rm -rf /var/www/<old-app-dir>
```
> Note: this project uses MongoDB **Atlas** (see `MONGODB_URI`), so a local DB on the droplet may not be involved — clear only what the old project used.
