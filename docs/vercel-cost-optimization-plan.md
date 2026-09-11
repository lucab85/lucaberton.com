# Vercel Cost-Optimization Plan — copypastelearn.com

> Audit-driven, priority-ordered plan to reduce ISR Reads and Fast Origin Transfer (FOT) without changing functionality.

## Background

Two line items dominate the Vercel bill:

| Item                | Share | Levers (common) |
| ------------------- | ----- | ---------------- |
| Fast Origin Transfer | ~29% | fewer origin→edge transfers, smaller payloads |
| ISR Reads            | ~23% | fewer cache regenerations, larger hits per 8 KB unit |

**Common levers for both:** fewer regenerations, more cache hits, smaller cached responses.

Route-level logs show `/shop`, `/`, and `/pricing` are the most active server-side routes. There is **no per-route billing attribution** from Vercel for ISR/FOT, so these logs define operational priority, not accounting truth.

## Priorities

| P# | Modification | Expected Impact | Risk | Verification |
|----|--------------|-----------------|------|--------------|
| **P0** | Create a per-project baseline before deploying: ISR Reads, ISR Writes, FOT, Function Invocations, and route traffic for `/shop`, `/`, `/pricing`, `/products/*`, `/bundles/*`, `/courses*`. | No direct savings, but indispensable for measuring later. | Low | Save at least one full comparable period; after each change, compare **normalized consumption per request**, not absolute dollars. |
| **P1** | Centralize `invalidatePublicCatalog()`. Invalidate tags `products`, `catalog`, `bundles` and paths `/shop`, `/`, `/products/[slug]`, `/bundles/[slug]`, plus relevant public API/feed routes. | Enabling; direct impact low. Makes P2/P3 safe. | Low–medium: incomplete invalidation = stale prices/catalog. | In staging, modify/publish/archive a product: shop, home, detail, and feed must reflect the new value immediately, without waiting for TTL. |
| **P2** | Eliminate server-side rendering for `/shop` filters. Make the base catalog static/cacheable; move `brand`, `type`, `category` filters to the client. With only 11 products, load once + filter in-browser. | Very high on FOT, high on ISR/compute. `/shop` is among the most active server routes. Target: **-80/95% of server renders for `/shop`**. | Medium: URL query strings, SEO/canonical, back/forward nav, and shareable filters must still work. | Production build must classify the shell as static/cacheable. A sequence of anonymous requests to `/shop` must become a HIT after warm-up; `/shop?brand=...` must not trigger a new server render of the catalog. |
| **P3** | Replace 60 s TTLs with on-demand invalidation. `/shop`, `/products/[slug]`, `/bundles/[slug]` currently use very short revalidation. Raise to **1 hour** first, then (after verification) to 24 h or pure on-demand. | Very high on ISR Reads, high on FOT. Reduces from potential regeneration-per-minute to once-per-change. | Medium until P1 is fully verified; low after P1. | No spontaneous regeneration of routes during periods with no content changes; after a mutation, the new version must appear immediately. |
| **P4** | Convert home and courses from time-based ISR to event-driven. Home uses both `getPublicCourses()` and `listPublishedProducts()` with hourly revalidation; public courses are already tagged/cached. | High on ISR Reads, medium on FOT. Home is a frequent server route. | Low–medium: must invalidate `/` when either a course or a product changes. | In absence of changes, `/` and `/courses` must not regenerate hourly. Publishing a course or product, the update must appear immediately. |
| **P5** | Separate the dynamic portion of `/pricing`. Currently `force-dynamic`, calls `auth()` and reads subscription state to personalize the CTA. Move user state into a small client island; leave pricing, FAQ, and SEO as static HTML. | Very high on FOT, almost no direct ISR Reads hit (route is dynamic today). Target: **>90% fewer anonymous server renders on `/pricing`**. | Medium–high: login, subscriber CTA, `?code=` coupons, and checkout are revenue-critical. | E2E test 4 cases: anonymous, authenticated non-subscriber, subscriber, coupon. Public HTML must be cacheable; no user-specific Clerk/subscription data must ever enter the shared cache. |
| **P6** | Reduce the size of cached responses. Avoid duplicated descriptions/JSON in the RSC payload; defer non-essential data; focus on `/shop` and home. | Medium on both. ISR Reads are counted in 8 KB units, so fewer bytes means fewer read units on a miss; reduces FOT too. | Low–medium: risk of UX/SEO regressions if useful content is removed. | Measure compressed HTML/RSC bytes before and after. Initial target: **-25%** on the heaviest pages without losing important indexable content. |
| **P7** | Optimize `/api/agent/products*` **after** the above. Currently list has `revalidate=60`, HTTP cache of 60 s, while the underlying query is already cached at 300 s. Align HTTP/data cache to the same event-driven contract. | Low today; potentially high if agentic traffic grows. | Medium due to interaction between caching, query variants, and per-IP rate limiting. | Only proceed if these endpoints show measurable weight. Then verify HIT ratio, freshness after mutation, and correct rate-limiter behavior. |

## Why P1 Comes Before TTL Changes

The catalog already uses `unstable_cache` with 300 s TTLs and tags `catalog/products` and `catalog/bundles`. The current model **combines very short time-based expiration with invalidation that is not fully aligned** across Data Cache, Full Route Cache, and pages sharing the same data.

Therefore, avoid this naive change:

```diff
- revalidate: 60
+ revalidate: 86400
```

…without first completing P1. You might save a lot but show stale prices or availability for hours.

## Highest-ROI Intervention: `/shop`

`/shop` reads `searchParams`, builds server-side filters, and queries the catalog per combination. It also uses `revalidate = 60`. With only 11 products, the cheapest approach is almost certainly:

```
catalog snapshot (static) → download once → filter client-side
```

This eliminates the need to treat `?brand=`, `?type=`, and `?category=` as distinct server-rendered pages. Keep the query string in the browser for UX and shareable links, but do **not** use it to generate new HTML from the origin.

Expected to reduce **Function Invocations**, **FOT**, and **ISR cache pressure** simultaneously.

## Operational Targets

After P1–P5, gate on these before micro-optimization:

| Metric | Target |
|--------|--------|
| ISR Reads | **-50% or more** for copypastelearn.com at comparable traffic |
| Fast Origin Transfer | **-40/60%** |
| `/shop` server renders | **-80%** |
| `/pricing` anonymous server renders | **-90%** |
| Freshness | Admin changes appear immediately on public pages (no TTL wait) |
| Cache safety | Zero Clerk/subscription/coupon-specific user data in shared HTML |

## Implementation: Three Separate PRs

To attribute improvements and enable clean rollbacks:

1. **PR #1 — Invalidation contract** (P1 + P0 baseline)
2. **PR #2 — `/shop` static + catalog TTL** (P2 + P3)
3. **PR #3 — `/pricing` static shell + home/courses event-driven** (P4 + P5 + P6)

P7 (`/`api/agent/products`) is deferred until the above are live and measured.
