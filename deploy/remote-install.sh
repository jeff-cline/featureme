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

# --- 5. Unpack the uploaded code (PRESERVING the database + env on redeploys) ---
echo "▶ Unpacking app…"
cp -a /root/featureme/prisma/prod.db /root/prod.db.bak 2>/dev/null || true
cp -a /root/featureme/.env /root/.env.bak 2>/dev/null || true
rm -rf /root/featureme
mkdir -p /root/featureme/prisma
tar xzf /root/featureme.tgz -C /root/featureme
cd /root/featureme
# restore preserved data so redeploys never wipe accounts/articles
[ -f /root/prod.db.bak ] && cp -a /root/prod.db.bak /root/featureme/prisma/prod.db || true
[ -f /root/.env.bak ] && cp -a /root/.env.bak /root/featureme/.env || true

# --- 6. Env: create if missing, then ALWAYS enforce the live URL + prod DB ---
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
# Force the public URL even if a stale/local .env got shipped in.
if grep -q '^APP_URL=' .env; then
  sed -i 's#^APP_URL=.*#APP_URL="https://featureme.io"#' .env
else
  echo 'APP_URL="https://featureme.io"' >> .env
fi
grep -q '^DATABASE_URL=' .env || echo 'DATABASE_URL="file:./prod.db"' >> .env

# --- 7. Install, migrate, seed, build ---
echo "▶ npm install (this is the slow part on a 1GB box)…"
npm install --no-audit --no-fund
echo "▶ Database…"
npm run db:push
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>{process.exit(n>0?0:7)})" || npm run db:seed
echo "▶ Building…"
npm run build

# --- 7b. Repair any syndication links saved with a localhost URL ---
echo "▶ Fixing any localhost links…"
DATABASE_URL="file:./prod.db" node -e '
const {PrismaClient}=require("@prisma/client");
(async()=>{const p=new PrismaClient();
const rows=await p.syndication.findMany({where:{remoteUrl:{contains:"localhost:3000"}}});
for(const r of rows){await p.syndication.update({where:{id:r.id},data:{remoteUrl:r.remoteUrl.replace(/https?:\/\/localhost:3000/g,"https://featureme.io")}});}
if(rows.length)console.log("  fixed "+rows.length+" link(s)");
await p.$disconnect();})().catch(e=>console.error(e.message));
' || true

# --- 8. Start with pm2 ---
echo "▶ Starting app…"
pm2 startOrReload deploy/ecosystem.config.js
pm2 restart featureme --update-env >/dev/null 2>&1 || true
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
