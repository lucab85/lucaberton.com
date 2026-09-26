import { test, expect, type Page } from '@playwright/test';

/**
 * Calendly popup booking flow (src/components/CalendlyPopup.astro), the
 * consulting CTAs (src/components/BlogConsultationCta.astro, per-post offers
 * in src/utils/blogConsultingCtas.ts) and the GA4 events around them
 * (src/components/ConversionTracker.astro).
 * Calendly's widget assets are stubbed so the suite stays offline and stable;
 * the stub reproduces the real widget's overlay DOM:
 *   .calendly-overlay > [.calendly-close-overlay, .calendly-popup > .calendly-popup-content > iframe, .calendly-popup-close]
 */

// Unconfigured post: ends on the generic Calendly consultation CTA.
const POST = '/blog/podman-vs-docker-2026/';
const POST_CLUSTER = 'kubernetes_devops';
// Configured post (entry in blogConsultingCtas.ts): contextual card injected mid-article.
const CONFIGURED_POST = '/blog/hermes-agent-oracle-cloud-free-tier-deployment/';

const WIDGET_JS = 'https://assets.calendly.com/assets/external/widget.js';
const WIDGET_CSS = 'https://assets.calendly.com/assets/external/widget.css';

type TrackedEvent = { event: string } & Record<string, unknown>;

const WIDGET_STUB = `
  window.__initCalls = 0;
  window.Calendly = {
    initPopupWidget: function (opts) {
      window.__initCalls += 1;
      window.__popupUrl = opts.url;
      var overlay = document.createElement('div');
      overlay.className = 'calendly-overlay';
      overlay.innerHTML =
        '<div class="calendly-close-overlay" onclick="Calendly.closePopupWidget()"></div>' +
        '<div class="calendly-popup"><div class="calendly-popup-content"><iframe title="Calendly"></iframe></div></div>' +
        '<div class="calendly-popup-close" onclick="Calendly.closePopupWidget()"></div>';
      document.body.appendChild(overlay);
    },
    closePopupWidget: function () {
      var o = document.querySelector('.calendly-overlay');
      if (o) o.parentNode.removeChild(o);
    }
  };`;

async function stubCalendlyAssets(page: Page, { failJs = false, failCss = false, delayMs = 0 } = {}) {
  await page.route(WIDGET_CSS, (route) =>
    failCss ? route.abort() : route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await page.route(WIDGET_JS, async (route) => {
    if (failJs) return route.abort();
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: WIDGET_STUB });
  });
}

/** Keep the real cookie-consent library out so a stubbed window.CookieConsent survives. */
async function blockConsentLibrary(page: Page) {
  await page.route('**/scripts/cookieconsent*.js', (route) => route.abort());
}

/**
 * Records every dataLayer event object in Node, so events pushed right
 * before a navigation (the native fallback) are still observable.
 */
async function recordEvents(page: Page): Promise<TrackedEvent[]> {
  const recorded: TrackedEvent[] = [];
  await page.exposeFunction('__recordEvent', (e: TrackedEvent) => { recorded.push(e); });
  await page.addInitScript(() => {
    const layer: any[] = [];
    const nativePush = Array.prototype.push;
    (layer as any).push = function (...args: any[]) {
      for (const a of args) {
        if (a && typeof a === 'object' && !Array.isArray(a) && typeof a.event === 'string') {
          (window as any).__recordEvent(JSON.parse(JSON.stringify(a)));
        }
      }
      return nativePush.apply(this, args);
    };
    (window as any).dataLayer = layer;
  });
  return recorded;
}

// The generic closing consultation CTA (Calendly) — selected by variant so
// other Calendly links on the page (author box, sticky bar) can't match.
const CTA = 'a[data-track-event="consulting_cta_click"][data-tp-cta-variant="schedule_free_assessment"]';
const cta = (page: Page) => page.locator(CTA);

test.describe('Calendly popup booking flow', () => {
  test('closing CTA opens the popup with attribution and fires the funnel events in order', async ({ page }) => {
    const events = await recordEvents(page);
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    await expect(cta(page)).toHaveCount(1);
    await cta(page).dispatchEvent('click');

    await expect.poll(() => page.evaluate(() => (window as any).__popupUrl)).toBeTruthy();
    expect(page.url()).toContain(POST); // no navigation away

    const popupUrl = new URL(await page.evaluate(() => (window as any).__popupUrl));
    expect(popupUrl.origin + popupUrl.pathname).toBe('https://calendly.com/lucaberton/');
    expect(popupUrl.searchParams.get('hide_gdpr_banner')).toBeNull(); // no analytics consent given
    expect(popupUrl.searchParams.get('utm_source')).toBe('lucaberton.com');
    expect(popupUrl.searchParams.get('utm_medium')).toBe('site');
    expect(popupUrl.searchParams.get('utm_campaign')).toBe(POST_CLUSTER);
    expect(popupUrl.searchParams.get('utm_content')).toBe(POST); // original landing page

    await expect.poll(() => events.map((e) => e.event)).toContain('booking_start');
    const names = events.map((e) => e.event);
    const ctaIdx = names.indexOf('consulting_cta_click');
    const startIdx = names.indexOf('booking_start');
    expect(ctaIdx).toBeGreaterThanOrEqual(0);
    expect(startIdx).toBeGreaterThan(ctaIdx);
    expect(names.filter((n) => n === 'booking_start')).toHaveLength(1);
    expect(names).not.toContain('booked_call');

    expect(events[ctaIdx].target_offer).toBe('ai_platform_assessment');
    expect(events[ctaIdx].topic_cluster).toBe(POST_CLUSTER);
    expect(events[ctaIdx].original_landing_page).toBe(POST);

    // booking_start carries the CTA that opened the scheduler
    const start = events[startIdx];
    expect(start.booking_source).toBe('calendly_popup');
    expect(start.booking_type).toBe('discovery_call');
    expect(start.target_offer).toBe('ai_platform_assessment');
    expect(start.cta_variant).toBe('schedule_free_assessment');
    expect(start.cta_position).toBe('post_conclusion');

    await expect(cta(page)).not.toHaveAttribute('aria-busy', 'true');
  });

  test('popup is a modal dialog: overlay role, contained close control, inert page, Escape, focus restore', async ({ page }) => {
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });
    await cta(page).dispatchEvent('click');

    const dialog = page.locator('.calendly-overlay[role="dialog"]');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const close = dialog.locator('.calendly-popup-close'); // close control lives inside the dialog
    await expect(close).toHaveAttribute('tabindex', '0');
    await expect(close).toHaveAttribute('role', 'button');
    await expect(close).toBeFocused();

    // Everything else on the page is inert, so focus cannot move to a page link.
    const allInert = await page.evaluate(() =>
      Array.from(document.body.children)
        .filter((el) => !el.classList.contains('calendly-overlay') && el.tagName !== 'SCRIPT')
        .every((el) => el.hasAttribute('inert')),
    );
    expect(allInert).toBe(true);
    const focusEscaped = await page.evaluate(() => {
      document.querySelector<HTMLAnchorElement>('#main-content a[href]')?.focus();
      const active = document.activeElement;
      return !!active && !document.querySelector('.calendly-overlay')!.contains(active);
    });
    expect(focusEscaped).toBe(false);

    await page.keyboard.press('Escape');
    await expect(page.locator('.calendly-overlay')).toHaveCount(0);
    await expect(page.locator('body > [inert]')).toHaveCount(0); // page restored
    await expect(cta(page)).toBeFocused(); // focus restored to the trigger

    // Reopen still works after a close (guards were cleared)
    await cta(page).dispatchEvent('click');
    await expect(page.locator('.calendly-overlay')).toHaveCount(1);
  });

  test('re-clicks while the widget is loading open one popup and fire booking_start once', async ({ page }) => {
    const events = await recordEvents(page);
    await stubCalendlyAssets(page, { delayMs: 400 });
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    await cta(page).dispatchEvent('click');
    await expect(cta(page)).toHaveAttribute('aria-busy', 'true');
    await cta(page).dispatchEvent('click');
    await cta(page).dispatchEvent('click');

    await expect.poll(() => page.evaluate(() => (window as any).__initCalls)).toBe(1);
    await expect.poll(() => events.filter((e) => e.event === 'booking_start').length).toBe(1);
    expect(page.url()).toContain(POST);
    await expect(cta(page)).not.toHaveAttribute('aria-busy', 'true');
  });

  test('hides Calendly’s own consent banner only when analytics consent was given here', async ({ page }) => {
    await blockConsentLibrary(page);
    await page.addInitScript(() => {
      (window as any).CookieConsent = { acceptedCategory: (c: string) => c === 'analytics' };
    });
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });
    await cta(page).dispatchEvent('click');

    await expect.poll(() => page.evaluate(() => (window as any).__popupUrl)).toBeTruthy();
    const popupUrl = new URL(await page.evaluate(() => (window as any).__popupUrl));
    expect(popupUrl.searchParams.get('hide_gdpr_banner')).toBe('1');
  });

  test('plain inline Calendly link (post-body style) is tracked as a consulting CTA and opens the popup', async ({ page }) => {
    const events = await recordEvents(page);
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const a = document.createElement('a');
      a.id = 'inline-calendly';
      a.href = 'https://calendly.com/lucaberton/';
      a.textContent = 'Book a consultation';
      document.querySelector('article')!.appendChild(a);
    });
    await page.locator('#inline-calendly').dispatchEvent('click');

    await expect.poll(() => page.evaluate(() => (window as any).__popupUrl)).toBeTruthy();
    await expect.poll(() => events.map((e) => e.event)).toContain('booking_start');
    const names = events.map((e) => e.event);
    expect(names.indexOf('booking_start')).toBeGreaterThan(names.indexOf('consulting_cta_click'));
    const clicked = events.find((e) => e.event === 'consulting_cta_click');
    expect(clicked?.cta_variant).toBe('inline_calendly_link');
    expect(clicked?.cta_position).toBe('inline');
    expect(events.find((e) => e.event === 'booking_start')?.cta_variant).toBe('inline_calendly_link');
  });

  for (const failure of ['script', 'stylesheet'] as const) {
    test(`falls back to native navigation when the widget ${failure} fails to load`, async ({ page }) => {
      const events = await recordEvents(page);
      await stubCalendlyAssets(page, failure === 'script' ? { failJs: true } : { failCss: true });
      await page.route('https://calendly.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<title>calendly stub</title>' }),
      );
      await page.goto(POST, { waitUntil: 'domcontentloaded' });

      const navigation = page.waitForRequest((req) => req.url().startsWith('https://calendly.com/lucaberton/'));
      await cta(page).dispatchEvent('click');
      const request = await navigation;

      expect(new URL(request.url()).searchParams.get('utm_source')).toBe('lucaberton.com');
      await expect.poll(() => events.map((e) => e.event)).toContain('booking_start');
      const start = events.find((e) => e.event === 'booking_start');
      expect(start?.booking_source).toBe('calendly_native_fallback');
      expect(start?.target_offer).toBe('ai_platform_assessment');
    });
  }

  test('modifier-click keeps the native link (no popup, widget never loaded)', async ({ page }) => {
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate((selector) => {
      const a = document.querySelector<HTMLAnchorElement>(selector)!;
      // Cancel on window (after document listeners) so the browser opens no tab.
      window.addEventListener('click', (e) => e.preventDefault(), { once: true });
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
      return { popupUrl: (window as any).__popupUrl, widgetLoaded: typeof (window as any).Calendly !== 'undefined' };
    }, CTA);
    expect(result.popupUrl).toBeUndefined();
    expect(result.widgetLoaded).toBe(false);
  });
});

test.describe('Contextual consulting CTA (blogConsultingCtas.ts)', () => {
  const CARD_LINK = 'a[data-track-event="consulting_cta_click"][data-tp-cta-variant="prototype_to_production"]';

  test('configured post gets one mid-article card with its offer, and the click is tracked', async ({ page }) => {
    const events = await recordEvents(page);
    await page.goto(CONFIGURED_POST, { waitUntil: 'domcontentloaded' });

    const link = page.locator(CARD_LINK);
    await expect(link).toHaveCount(1); // injected once; the hidden source is removed
    await expect(link).toHaveAttribute('href', '/production-ai-assessment/');
    await expect(link).toHaveAttribute('data-tp-target-offer', 'agent_platform_assessment');
    await expect(link).toHaveAttribute('data-tp-cta-position', 'inline_50');
    await expect(page.locator('article aside', { has: page.locator(CARD_LINK) })).toBeVisible();

    await link.dispatchEvent('click');
    await page.waitForURL(/\/production-ai-assessment\/$/);
    const click = events.find((e) => e.event === 'consulting_cta_click');
    expect(click?.target_offer).toBe('agent_platform_assessment');
    expect(click?.cta_position).toBe('inline_50');
    expect(click?.cta_variant).toBe('prototype_to_production');
    expect(click?.topic_cluster).toBe('self_hosted_agents');
  });

  test('configured post drops the generic closing CTA so there is one primary consulting action', async ({ page }) => {
    await page.goto(CONFIGURED_POST, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(CTA)).toHaveCount(0);
  });

  test('card headings stay out of the table of contents', async ({ page }) => {
    await page.goto(CONFIGURED_POST, { waitUntil: 'load' });
    const toc = page.locator('#toc-list');
    await expect(toc.locator('a', { hasText: 'Securing the Instance' })).toHaveCount(1);
    await expect(toc.locator('a', { hasText: 'Prototype working?' })).toHaveCount(0);
  });

  test('unconfigured post has no contextual card', async ({ page }) => {
    await page.goto(POST, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[data-tp-cta-position="inline_50"][data-track-event="consulting_cta_click"]')).toHaveCount(0);
  });
});
