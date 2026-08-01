# FeatureMe

A personal-branding / **AEO (Answer Engine Optimization)** SaaS. Members get a public,
schema-rich profile page at `featureme.io/<name>`, publish "news releases" once, and syndicate
them across trusted platforms to earn **citations back to the source** — the signal answer engines
(ChatGPT, Perplexity, Google AI Overviews) reward.

## What's built

- **Public profile microsites** `/<slug>` — `Person` + `FAQPage` JSON-LD, OG tags, canonical URLs,
  profile image, YouTube embed, press links, FAQ, latest news.
- **Homepage keyword cloud** — every published member is internally linked by name + keywords
  (the internal-link authority engine).
- **Member app** (left-nav): Dashboard · My Profile (WYSIWYG bio/about) · News Releases · Connections.
- **News release composer** — title + WYSIWYG body (images/links) + canonical source URL →
  one submit fans out to every connected platform.
- **Syndication engine** — pluggable adapters (`newsroom` always-on RSS, `dev.to`, `Hashnode`,
  OAuth placeholders for Medium/Blogger/Tumblr/LinkedIn). Connect-once model.
- **God/admin account** — members management, coupon engine, plan tiers ($99 / $299 / $999).
- **SEO plumbing** — dynamic `sitemap.xml`, `robots.txt`, newsroom `feed.xml`.
- **Click tracking** — `/r/<id>` outbound redirects + profile-view logging.
- **Email module** — console (default) / SMTP / ZeptoMail ("Zapmail") behind env vars.
- **Auth** — email+password (bcrypt), signed session cookie, forced password change on first login.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Prisma + SQLite · Tiptap WYSIWYG.

## Run locally

```bash
npm install
npm run setup     # prisma db push + seed (creates God account + plans + targets)
npm run dev       # http://localhost:3000
```

God account (seeded): `jeffcline@me.com` / `TEMP!234` → forced reset on first login.

## Deploy / go-live

See [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) for the steps only the owner can do
(server deploy, DNS, Stripe keys, platform OAuth apps).

## Strategy

See [`docs/SYNDICATION-STRATEGY.md`](docs/SYNDICATION-STRATEGY.md) for the free-citation playbook —
which platforms, how others do it, and the best-practice roadmap.
