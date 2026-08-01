# Free-citation & syndication strategy (how to actually get featured)

The goal: earn **citations** back to a member's profile/brand so answer engines (ChatGPT, Perplexity,
Google AI Overviews) and classic search treat them as an authority. Below is how this is really done,
the honest limits, and the free platform set the app targets.

## The honest reality (read this first)
- **"One submit → hundreds of sites" is a paid-wire marketing promise**, not a free capability. Free
  fan-out realistically reaches **~8–12 genuinely trusted platforms**. For AEO that is *better* than
  hundreds of spam directories, which answer engines discount or ignore.
- **Identical content blasted everywhere triggers spam systems.** We publish a canonical original and
  use `rel=canonical` on copies (already implemented). Distributed *brand mentions* still feed AEO
  even when the copy doesn't rank.
- Real authority comes from **consensus across trusted sources + being crawlable + structured data** —
  not raw link count.

## How others actually do this (the playbook)
1. **Hub-and-spoke.** One canonical "hub" (the profile / newsroom post) + republished "spokes" on
   trusted platforms, each linking back. This app is built around it.
2. **Canonical republishing.** Medium (native import sets canonical), dev.to & Hashnode (`canonical_url`
   field), LinkedIn Articles, Substack, Tumblr, Blogger. The original keeps the SEO credit.
3. **RSS + automation fan-out.** Publish once → RSS feed → Zapier/Make/n8n push to platform APIs. The
   app's `feed.xml` is the seed; adapters are the "many out."
4. **Structured data everywhere.** `Person`, `FAQPage`, `NewsArticle` JSON-LD (all implemented) so LLMs
   can parse and quote cleanly. Add an `llms.txt` later.
5. **Editorial sourcing.** Qwoted / Featured (formerly HARO) / Help a B2B Writer — members answer
   journalist queries and earn *real* press citations. Highest-authority, entirely free. (Roadmap: a
   "press opportunities" inbox in the dashboard.)
6. **Atomization.** One release → LinkedIn post, X thread, a Quora/Reddit answer, a YouTube description.
   Same message, native to each platform. (Roadmap: repurpose generator.)
7. **Internal-link cloud.** The homepage keyword cloud links every member by name + keyword. Simple,
   effective internal-authority routing. Implemented.

## Free platform set (what the adapters target)
| Platform | Auth | Canonical support | Authority | Status in app |
|---|---|---|---|---|
| On-site Newsroom + RSS | none | n/a (is the hub) | grows with domain | ✅ live |
| dev.to | API key | ✅ `canonical_url` | medium | ✅ live adapter |
| Hashnode | token | ✅ | medium | ◻ stub (finish mutation) |
| Medium | OAuth | ✅ import | high | ◻ OAuth stub |
| Blogger | Google OAuth | partial | medium | ◻ OAuth stub |
| Tumblr | OAuth | partial | low-med | ◻ disabled |
| LinkedIn (org) | OAuth | n/a | high | ◻ disabled (app review) |
| Substack | email/RSS | via canonical | medium | roadmap |
| Mastodon | API token | n/a (mention) | low-med | roadmap |

**Free PR directories** (OpenPR, PRLog, PR.com, 1888PressRelease, IssueWire free tier): mostly
form-based, many `nofollow`, low authority. Low priority — fine as breadth once the trusted set is live.

## Paid expansion (phase 2 — "then we'll find APIs")
- **EIN Presswire** (~$100–300/release): clean submission API, best reach-per-dollar.
- ACCESS Newswire, Newswire.com, PRWeb; PR Newswire / Business Wire / Cision are enterprise/contract.
- These are additional adapters behind the same "one submit" composer.

## Compliance note
If a member is in a regulated vertical (e.g. Medicare/insurance — 1-800-Medigap), releases still carry
CMS/TPMO rules: non-government-entity disclaimer, no misleading/superlative claims, `.gov`-only official
redirects. Keep a per-client compliance flag before enabling auto-syndication for those members.
