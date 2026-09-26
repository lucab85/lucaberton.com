# Analytics events — canonical schema

Source of truth for GA4 event names, parameters, and monetization priority on
lucaberton.com. Implementation: `src/components/ConversionTracker.astro`
(declarative `data-track-event` / `data-tp-*` attributes; property
`G-M9Q5F672JT`). Do not invent new event names — differentiate with
parameters (`company`, `offer_id`, `target_offer`).

## Monetization priority

1. Qualified consulting leads from organic (north star)
2. Discovery calls / assessment submissions
3. Blog → commercial-page CTR
4. Email capture
5. Bootcamp applications
6. Affiliate revenue

An enterprise-intent article (GPU/OpenShift AI/MLOps governance) shows an
assessment CTA first, even when an affiliate offer could monetize the same
visitor.

## Events

| Event | Fires when | Key params | GA4 role |
|---|---|---|---|
| `consulting_cta_click` | CTA toward services/assessment/Calendly clicked (un-annotated Calendly links count too: `cta_variant=inline_calendly_link`) | `target_offer`, `cta_position`, `cta_variant` | micro-conversion |
| `booking_start` | Calendly scheduler actually opened — popup init, or native-navigation fallback (`booking_source`) | `booking_type`, `booking_source` | micro-conversion |
| `booked_call` | Calendly confirmed the booking: `calendly.event_scheduled` postMessage from the popup (`src/components/CalendlyPopup.astro`, works on the free plan) — or `/call-booked/` viewed via the paid-plan success redirect | `booking_type`, `booking_source` | **key event** |
| `assessment_submit` | reserved — fire when an on-site assessment form ships | `target_offer` | **key event** (future) |
| `email_signup_start` | newsletter CTA/form opened | `form_id` | micro-conversion |
| `email_signup` | `/newsletter-thank-you/` viewed (Kit success redirect) | `form_id` | **key event** |
| `bootcamp_click` | link toward `/ai-platform-engineer-bootcamp/` (auto) | `cta_variant` | micro-conversion |
| `bootcamp_apply_start` | first focus inside the application form | — | micro-conversion |
| `bootcamp_application_submitted` | application POST succeeded (name kept for data continuity; add a separate purchase event only if paid enrollment moves on-site) | — | **key event** |
| `affiliate_click` | outbound affiliate/partner CTA clicked — one event for ALL partners | `company`, `offer_id`, `offer_type`, `cta_position`, `cta_variant`, `destination_url` | key event (lowest priority) |

CTA clicks are operational metrics; `booked_call`, `assessment_submit`,
`email_signup`, and `bootcamp_application_submitted` are the numbers to quote
as "conversions".

## Shared parameters (every event)

- `page_path`, `page_type` (`article` / `page` / `confirmation`)
- `topic_cluster` — from `src/utils/topicCluster.ts`, stamped on the article
  element (`data-page-context`) in `src/pages/blog/[slug].astro` and
  `src/layouts/BlogLayout.astro`
- First-touch attribution (localStorage, 30-day TTL): `original_landing_page`,
  `original_topic_cluster`, `original_referrer`, `utm_source/medium/campaign`
  (when present), `first_consulting_cta` — so a booking on `/contact/` still
  reports which article created it. No PII is ever sent.

`cta_position` controlled set: `top_banner`, `hero`, `inline_25`, `inline_50`,
`inline_75`, `inline` (depth unknown — auto-tracked links in post bodies),
`post_solution`, `post_conclusion`, `sidebar`, `sticky_bar`, `related_offer`.

## Calendly booking flow

Every `calendly.com/lucaberton` link on the site opens as a Calendly popup
(assets lazy-loaded on first click). The popup URL carries attribution as UTM
params (`utm_campaign` = original topic cluster, `utm_content` = original
landing page) so the booking record inside Calendly shows which article
created it. Add `data-calendly-native` to a link to opt out of the popup;
modifier-clicks and no-JS visitors always get the native link.

## Adding a tracked CTA

```html
<a href="…"
   data-track-event="affiliate_click"
   data-tp-company="racknerd"
   data-tp-offer-id="racknerd_vps_4gb"
   data-tp-offer-type="affiliate"
   data-tp-cta-position="post_solution"
   data-tp-cta-variant="skip_free_tier_queue">…</a>
```

Forms: `data-track-start-event` (first focus) and `data-track-submit-event`.
Async success handlers: `window.lucaTrack(name, params)`.
Confirmation pages: `data-track-pageview-event` on the `data-page-context`
element (deduped per session against refreshes).

## External setup (not in this repo)

- **Kit**: set each form's success redirect to
  `https://lucaberton.com/newsletter-thank-you/`.
- **Calendly**: nothing required on the free plan — `booked_call` comes from
  the popup. On a paid plan you may additionally set each event type's
  confirmation redirect to `https://lucaberton.com/call-booked/`
  (optionally `?booking_type=<slug>`); the two paths never double-count
  because the redirect replaces the popup's page.
- **GA4 admin**: mark the four key events above as key events; register custom
  dimensions `topic_cluster`, `cta_position`, `cta_variant`, `target_offer`,
  `company`, `offer_id`, `page_type`, `original_landing_page`,
  `original_topic_cluster`, `booking_type`, `form_id`.
- Baseline 28–60 days before setting targets; then fix funnel leakage (CTA
  CTR, form completion) before chasing more traffic.
