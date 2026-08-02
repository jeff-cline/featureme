#!/usr/bin/env bash
# Runs ON the server (piped in over SSH by the local FeatureMe-DEPLOY.command).
# Installs everything, deploys the app code that was just uploaded, and turns on HTTPS.
set -e
echo "==================================================================="
echo " FeatureMe server install starting…"
echo "==================================================================="

# --- 1. Swap (1 GB box needs it so the Next build doesn't get OOM-killed) ---
if ! swapon --show | grep -q /swapfile; then
  echo "▶ Adding 2G swap…"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

export DEBIAN_FRONTEND=noninteractive

# --- 2. Node 20, git, build tools ---
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  echo "▶ Installing Node 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y git build-essential ca-certificates curl >/dev/null

# --- 3. pm2 ---
command -v pm2 >/dev/null 2>&1 || npm i -g pm2

# --- 4. Caddy (automatic HTTPS) ---
if ! command -v caddy >/dev/null 2>&1; then
  echo "▶ Installing Caddy…"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https >/dev/null
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update >/dev/null
  apt-get install -y caddy
fi

# --- 5. Unpack the uploaded code ---
echo "▶ Unpacking app…"
rm -rf /root/featureme
mkdir -p /root/featureme
tar xzf /root/featureme.tgz -C /root/featureme
cd /root/featureme

# --- 6. Env (only create if missing, so re-runs keep your keys) ---
if [ ! -f .env ]; then
  echo "▶ Writing .env…"
  cat > .env <<EOF
DATABASE_URL="file:./prod.db"
SESSION_SECRET="$(openssl rand -hex 32)"
APP_URL="https://featureme.io"
APP_NAME="FeatureMe"
ADMIN_EMAIL="jeffcline@me.com"
ADMIN_PASSWORD="TEMP!234"
EMAIL_PROVIDER="console"
EOF
fi

# --- 7. Install, migrate, seed, build ---
echo "▶ npm install (this is the slow part on a 1GB box)…"
npm install --no-audit --no-fund
echo "▶ Database…"
npm run db:push
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>{process.exit(n>0?0:7)})" || npm run db:seed
echo "▶ Building…"
npm run build

# --- 8. Start with pm2 ---
echo "▶ Starting app…"
pm2 startOrReload deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# --- 9. HTTPS via Caddy ---
echo "▶ Configuring HTTPS (Caddy)…"
cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl enable caddy >/dev/null 2>&1 || true
systemctl restart caddy

echo "==================================================================="
echo " ✅ DONE. Open https://featureme.io (HTTPS cert issues in ~30s)."
echo " Sign in: jeffcline@me.com / TEMP!234  (you'll be forced to reset)"
echo "==================================================================="
