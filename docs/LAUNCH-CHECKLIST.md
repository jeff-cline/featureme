# Launch checklist — owner-only steps

The app is fully built. These are the steps **only you can do**, because they require logging into
your own accounts or entering credentials — which I can't do on your behalf. Each is quick.

## 0. Security first
- [ ] **Rotate the Vultr root password.** It was pasted into chat, so treat it as exposed.
      On the server: `passwd`. Better: create a non-root sudo user + disable root SSH login.
- [ ] Never commit `.env`. It's already git-ignored. Secrets live only on the server.

## 1. Server + domain (Vultr → featureme.io)
- [ ] Point `featureme.io` DNS **A record** at your Vultr IP.
- [ ] On the server: install Node 20+, `git clone git@github.com:jeff-cline/featureme.git`.
- [ ] `npm install && npm run setup && npm run build`.
- [ ] Run it under a process manager: `pm2 start "npm start" --name featureme` (port 3000).
- [ ] Put **Nginx or Caddy** in front for HTTPS (Caddy auto-TLS is one line). Reverse-proxy to :3000.
- [ ] Set real env values on the server: `APP_URL=https://featureme.io`, a fresh `SESSION_SECRET`
      (`openssl rand -hex 32`), and your `ADMIN_EMAIL` / a strong `ADMIN_PASSWORD`.

## 2. Change the God-account password
- [ ] Visit `https://featureme.io/login`, sign in with the seeded temp password, set a new one
      (the app forces this on first login).

## 3. Billing (Stripe) — turns on the $99 / $299 / $999 plans + coupons at checkout
- [ ] Create a Stripe account, create 3 recurring Prices, paste their IDs into the `Plan` rows
      (admin or DB), and set `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`.
- Coupons and plan definitions already work in the God account today; Stripe just enables charging.

## 4. Email (ZeptoMail / "Zapmail")
- [ ] Create a ZeptoMail (or any SMTP) account, verify `featureme.io` sending domain.
- [ ] Set `EMAIL_PROVIDER=zeptomail` + `ZEPTOMAIL_TOKEN` (or `EMAIL_PROVIDER=smtp` + SMTP_* vars).
      Until then, member-invite emails print to the server log (nothing is lost).

## 5. Syndication platform authorizations (per platform, one-time)
The "connect once, post forever" model. **You** authorize; the app posts after that.
- [ ] **dev.to** — you (or each member) paste a dev.to API key on the Connections page. **Works today.**
- [ ] **Hashnode** — paste a personal access token + publication ID. **Works today** once you finish
      the publish mutation in `src/lib/syndication.ts` (marked as a real integration point).
- [ ] **Medium / Blogger / LinkedIn / Tumblr** — register a developer app on each platform to get
      OAuth client credentials, then flip the target `enabled` and wire the OAuth callback. The
      adapters and UI are already stubbed for this.
- The **Newsroom (RSS)** target needs nothing — it's always on and is what answer engines crawl first.

## What's already done (no action needed)
Auth, God account, member accounts + forced password reset, WYSIWYG profiles, FAQ/Person schema,
sitemap/robots/RSS, coupon engine, plan tiers, dashboards, click tracking, the news-release composer,
and the dev.to syndication adapter.
