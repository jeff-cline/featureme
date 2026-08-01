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

---

## Verified evidence (deep research, Aug 2026 — 24 sources, adversarial fact-check)

A 106-agent research pass fetched 24 sources, extracted 115 claims, and adversarially
verified 25 (needed 2/3 "confirm" votes to survive). **9 confirmed, 16 refuted.** Below is
only what survived — plus the popular claims that *failed*, so we don't build on myths.

### ✅ Confirmed — build on these
1. **AEO optimizes for *citation*, not ranking.** The goal is being quoted/extracted/linked by
   ChatGPT, Perplexity, AI Overviews, Gemini — not a #1 position. (Corroborated across Contently,
   HubSpot, Frase, WRITER.) Our whole hub-and-spoke + schema approach targets this directly.
2. **Structured data helps — indirectly.** FAQPage + Article/BlogPosting + Person + Organization
   schema improve citation *eligibility* via Knowledge-Graph/rich-result pipelines. Google's
   Ryan Levering and Microsoft's Fabrice Canel both stated publicly that schema helps their LLMs.
   Caveat: a Feb-2026 test found LLMs may tokenize JSON-LD as *raw text*, so the effect is
   indirect, not a magic parse. **We already emit Person + FAQPage + NewsArticle JSON-LD.**
3. **Freshness measurably matters.** Ahrefs' 17M-citation study: AI-cited URLs are **25.7% fresher**
   than organic results (avg 1,064 vs 1,432 days). → Keep profiles/releases updated; our
   `sitemap.xml` already emits `lastModified`. (Roadmap: a "refresh" nudge in the dashboard.)
4. **Medium, dev.to, Hashnode, HackerNoon, In Plain English ALL support canonical.** Medium's
   Import tool auto-sets `rel=canonical` to the source. This is the backbone of the spoke set.
5. **API fan-out is real and preserves canonical:** dev.to `POST /api/articles` (`api-key` header,
   `canonical_url` field) and Hashnode GraphQL (`gql.hashnode.com`, PAT, `originalArticleURL`).
   ⚠️ **Hashnode write now requires a Hashnode Pro plan** — noted in the adapter.
6. **Duplicate-content risk is real → canonical is mandatory, not optional.** Republishing to a
   higher-authority site can let *it* win the canonical and outrank your original. No Google
   *penalty* (Mueller), but you lose the credit without canonical. We set canonical on every copy.
7. **RSS→social automations alone earn NO citations.** Off-the-shelf RSS-to-social (e.g. n8n's
   template) posts only to social feeds, where outbound links are ~universally **nofollow** — no
   authority passes. Social drives awareness; citations require canonical-supporting *publishing*
   platforms + schema. → Our fan-out targets publishing platforms, not just social.

### ❌ Refuted — treat as marketing, do NOT rely on
- "DR>60 / 32,000+ referring domains = 3.5× more citations" (failed).
- Per-engine source-bias percentages ("Wikipedia = 47.9% of ChatGPT," etc.) (failed).
- "Brand-authority correlation 0.334" / "5+ authority sources = 2.7× mentions" (failed).
- "FAQPage is the single strongest signal / 72.4% of cited pages have answer capsules" (failed).
- Prescriptive chunking rules (200–300 token micro-docs, 40–60 word capsules, stat every 150 words) (failed).
- "`llms.txt` + allowing OAI-SearchBot are *required* for citation" (failed — value genuinely uncertain).
- "schema.org `sameAs` → Wikidata prevents LLM hallucination" (failed).

### ❓ Still open (don't overclaim to clients)
- Which free **PR sites** actually pass dofollow / get indexed — no claim survived. (Assume low value.)
- True dofollow/nofollow of Medium/dev.to/Hashnode **outbound** links — unresolved (canonical still works).
- Whether **HARO-successors** (Featured, Qwoted, Help a B2B Writer) measurably drive AI citations — unproven.

## 30-day "get featured" plan for a new member
- **Week 1 — Foundation:** complete the profile (bio, about, image, 5+ FAQs, keywords), publish it
  (Person+FAQ schema goes live), add 2–3 real prior press links.
- **Week 2 — First release + canonical spokes:** publish one news release (canonical = the member's
  own site if they have one), syndicate to Newsroom + dev.to (live today). Connect Medium, import
  the release (auto-canonical).
- **Week 3 — Earned media:** answer 3–5 Featured/Qwoted/Help-a-B2B-Writer queries per week in the
  member's expertise (free tiers). These are the highest-authority citations available for $0.
- **Week 4 — Cadence + freshness:** second release, atomize it (LinkedIn post, X thread, one Quora
  answer), and refresh the profile. Then repeat weekly. Consistency + freshness beat volume.

## Compliance note
If a member is in a regulated vertical (e.g. Medicare/insurance — 1-800-Medigap), releases still carry
CMS/TPMO rules: non-government-entity disclaimer, no misleading/superlative claims, `.gov`-only official
redirects. Keep a per-client compliance flag before enabling auto-syndication for those members.
