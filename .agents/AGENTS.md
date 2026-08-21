# Project Guidelines - Devine FMCG

## Automatic Deployment to DigitalOcean Droplet

- **Droplet IP**: `168.144.180.123`
- **SSH Password**: `PeriviHari@8A`
- **SSH Command (Windows)**:
  `echo y | & "C:\Program Files\PuTTY\plink.exe" -ssh root@168.144.180.123 -pw "PeriviHari@8A" "<command>"`

### Deployment Workflow:
Whenever code changes (frontend or backend) are made to this project:
1. Ensure changes are committed and pushed to `origin/main` (or synced to `/var/www/devine`).
2. Run deployment on the droplet:
   `echo y | & "C:\Program Files\PuTTY\plink.exe" -ssh root@168.144.180.123 -pw "PeriviHari@8A" "bash /var/www/devine/deploy/deploy.sh"`
3. Verify that `devine-api` is running cleanly (`pm2 status`) and frontend/backend build completed without errors.
