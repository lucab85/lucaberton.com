# Road to 1M Views/Month — Data-Accurate Growth Plan

> **Last updated:** 2026-06-07. This plan replaces an earlier version that was based on
> inaccurate numbers (it claimed 633K impressions/month at 0.32% CTR). The figures below are
> taken directly from the GSC exports in `/reports/`. 1M views/**month** is treated here as a
> **long-term (18–36 month) north star**, with realistic interim milestones.

## Real Baseline (GSC, 11 Feb – 9 May 2026)

Source: `reports/lucaberton.com_SearchPerformanceOverview_All_5_11_2026.csv` and
`reports/lucaberton.com_KeywordReport_5_11_2026.csv`.

| Metric | Actual value |
|--------|--------------|
| Impressions | **3,210 total** over 88 days (~1,400/month) |
| Clicks | **150 total** (~64/month) |
| Average CTR | **4.67%** (healthy — this is **not** the problem) |
| Indexed/published posts | **1,448** (0 drafts) |
| Impressions per page | **~1 per page per month** |
| Position profile | 92 queries pos 1–3 (137 impr), 316 queries pos 4–10 (1,856 impr) |

**CTR is fine. The bottleneck is impressions — almost nobody sees these pages in search.**

## The #1 Insight: 95% of traffic comes from 5.6% of the content

| Theme | Posts | Queries | Impressions | Clicks |
|-------|-------|---------|-------------|--------|
| **OpenClaw** | 81 | 341 | 1,889 | **133 (95%)** |
| Everything else | ~1,367 | 68 | ~105 | ~8 (5%) |

Despite **930 Kubernetes, 487 Docker, 383 GPU, 366 Ansible** posts, those competitive topics
generate ≈0 search traffic. OpenClaw wins because it is a **low-competition, emerging-tool
niche** where specific, accurate, first-mover error/how-to content ranks (positions 5–7).

**That is the repeatable playbook. The mistake to avoid is publishing more competitive-topic
content that cannot rank at the current domain authority.**

## What changed the strategy

The previous plan prescribed "publish 3,000 more programmatic pages, 20/day." The site already
ran that experiment — **871 posts were published in April 2026 alone** (215 Feb, 114 Mar,
91 May, 93 Jun) — and search visibility stayed flat at ~1,400 impressions/month. Mass
publishing on competitive topics without authority does not work and risks Google's
Helpful-Content quality discount. **This plan does the opposite: focus, authority, quality.**

## Gap to 1M Views/Month (honest math)

At a healthy ~5% CTR, 1M clicks/month ≈ **20M impressions/month** — roughly **14,000× today**.
That is a multi-year outcome, reachable only by (a) winning many OpenClaw-style niches,
(b) building domain authority so existing pages rank, and (c) adding non-Google traffic
(YouTube, email, social). Interim milestones below are the real plan; 1M/month is the horizon.

| Horizon | Realistic monthly views | How |
|--------|--------------------------|-----|
| Month 3 | 500 – 1,500 | Harvest OpenClaw quick wins + stop dilution |
| Month 6 | 3,000 – 10,000 | Authority engine starts; 2–3 new niches landing |
| Month 12 | 30,000 – 100,000 | Authority compounds; niche portfolio + distribution |
| Month 18–36 | 250,000 → 1,000,000 | Portfolio of won niches + backlinks + YouTube/email flywheel |

---

## Phase 1 — Stop dilution & harvest quick wins (Weeks 1–4)

The fastest clicks are already-ranking OpenClaw queries sitting at position 5–8.

- [x] De-cannibalize the 3 competing `allowedOrigins` posts (done 2026-06-06).
- [ ] **Pause mass publishing** on competitive topics (Kubernetes/Docker/Ansible "tutorial"
      style). Velocity is a liability, not an asset, until authority catches up.
- [ ] Push these striking-distance queries from pos 5–8 toward top-3 (richer answer in the
      first 100 words, FAQ/HowTo schema, exact-match H2s):
  - `origin not allowed (open the control ui …)` — 920 impr, pos 5.7 → **+145 clicks/mo potential**
  - `gateway.controlui.allowedorigins` — 135 impr, pos 6.2
  - `openclaw gateway run` — 65 impr, pos 8.2, 0 clicks (gap now filled in CLI reference)
  - `gateway.controlui.basepath` — 22 impr, pos 6.7, 0 clicks
- [ ] Add FAQ/HowTo structured data to the top ~20 OpenClaw posts (rich results lift CTR).

## Phase 2 — Authority engine (Weeks 1–12, the real gating factor)

Domain authority is what lets your existing 1,448 pages rank for more queries. The author is a
**Docker Captain, 8-book author, KubeCon EU & Red Hat Summit 2026 speaker** — currently
under-leveraged for links and E-E-A-T.

- [ ] Strengthen author E-E-A-T: complete `Person`/`author` schema, bylines, author bio blocks
      with credentials on every post (links to books, talks, GitHub, LinkedIn).
- [ ] Earn backlinks from owned assets first: conference slide decks (SpeakerDeck/SlideShare),
      book pages (Leanpub/Amazon author links), GitHub repos → site.
- [ ] Guest posts / syndication with canonical tags: dev.to, Hashnode, DZone, The New Stack.
- [ ] Targeted outreach: when an OpenClaw/tool post is genuinely the best resource, pitch it to
      relevant docs, awesome-lists, and community wikis.

## Phase 3 — Replicate the OpenClaw playbook (Ongoing, quality-gated)

Find the *next* OpenClaw: emerging tools with rising search demand and weak competition.

- [ ] Maintain a shortlist of emerging dev tools / AI-agent frameworks (new releases, new error
      messages, new config surfaces). Publish accurate, first-mover error/how-to content.
- [ ] **One niche at a time, fully** (hub + 10–20 spokes, interlinked) before starting the next.
- [ ] Quality bar: every post must answer a real query better than the current top result.
      No thin programmatic dumps.

## Phase 4 — Consolidate & prune the dead weight (Weeks 4–16)

1,448 thin pages dilute crawl budget and authority. Fewer, stronger pages rank better.

- [ ] Identify zero-impression posts (no GSC impressions in 90 days).
- [ ] Merge near-duplicate/thin posts into canonical pillar guides; 301 the rest.
- [ ] Keep only posts that are either ranking, part of a hub, or genuinely best-in-class.

## Phase 5 — Traffic independent of Google (Ongoing)

Reduce single-channel dependence and create return visits.

- [ ] **YouTube → blog**: companion post for top videos; "read the full guide" links in
      descriptions. (Channel already has a large back catalog to mine.)
- [ ] **Email**: grow the Kit list; weekly digest of best posts → repeat visits.
- [ ] **Social**: LinkedIn (author's strength) + targeted Reddit/HN for genuinely original pieces.

---

## Metrics to track (monthly)

| Metric | Baseline | M3 | M6 | M12 |
|--------|----------|----|----|-----|
| Impressions/mo | 1,400 | 10K | 60K | 500K |
| Clicks/mo | 64 | 800 | 4K | 30K |
| Queries in pos 1–3 | 92 | 200 | 600 | 3,000 |
| Referring domains | (baseline TBD) | +10 | +40 | +150 |
| Niches "owned" (hub+spokes ranking) | 1 (OpenClaw) | 2 | 4 | 8 |

## Immediately executable (this week)

1. Harvest Phase 1 quick wins on the OpenClaw cluster (schema + first-paragraph answers).
2. Add author E-E-A-T schema/bio blocks sitewide (Phase 2 foundation).
3. Pause/redirect competitive-topic publishing; draft the niche-replication shortlist.

## The one-sentence summary

You do not have a CTR problem or a content-volume problem — you have an **authority and focus**
problem: 95% of traffic comes from one low-competition niche, so the path to scale is to
**replicate that niche-winning playbook and build the domain authority** that lets your existing
content finally rank — not to publish more pages that can't.
