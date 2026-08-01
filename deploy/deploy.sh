#!/usr/bin/env bash
# One-command deploy for FeatureMe on the Vultr box.
# Run this ON THE SERVER after `git clone`. Re-run it any time to update.
#   bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Pulling latest…"
git pull --ff-only || true

echo "▶ Installing deps…"
npm ci || npm install

echo "▶ Database (push schema + seed if empty)…"
npm run db:push
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>{if(n===0){require('child_process').execSync('npm run db:seed',{stdio:'inherit'})}process.exit(0)})" || npm run db:seed

echo "▶ Building…"
npm run build

echo "▶ (Re)starting with pm2…"
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload deploy/ecosystem.config.js
  pm2 save
else
  echo "pm2 not installed. Install with: npm i -g pm2"
  echo "Then: pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup"
fi

echo "✅ Deployed. App on http://127.0.0.1:3000 — put Caddy/Nginx in front for HTTPS."
