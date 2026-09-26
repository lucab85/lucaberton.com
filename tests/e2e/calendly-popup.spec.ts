import { test, expect, type Page } from '@playwright/test';

/**
 * Calendly popup booking flow (src/components/CalendlyPopup.astro) and the
 * GA4 conversion events around it (src/components/ConversionTracker.astro).
 * Calendly's widget assets are stubbed so the suite stays offline and stable.
 */

const POST = '/blog/hermes-agent-oracle-cloud-free-tier-deployment/';
const WIDGET_JS = 'https://assets.calendly.com/assets/external/widget.js';
const WIDGET_CSS = 'https://assets.calendly.com/assets/external/widget.css';

type TrackedEvent = { event: string } & Record<string, unknown>;

async function stubCalendlyAssets(page: Page, { fail = false } = {}) {
  await page.route(WIDGET_CSS, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(WIDGET_JS, (route) => {
    if (fail) return route.abort();
    return route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `window.Calendly = {
        initPopupWidget: function (opts) { window.__popupUrl = opts.url; },
        closePopupWidget: function () {}
      };`,
    });
  });
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

// The per-post consultation CTA (BlogConsultationCta.astro) — selected by its
// variant so other annotated Calendly links on the page (author box, sticky
// bar) can't be picked up by accident.
const annotatedCalendlyCta = (page: Page) =>
  page.locator('a[data-track-event="consulting_cta_click"][data-tp-cta-variant="schedule_free_assessment"]');

test.describe('Calendly popup booking flow', () => {
  test('annotated CTA opens the popup with attribution and fires the funnel events in order', async ({ page }) => {
    const events = await recordEvents(page);
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    await expect(annotatedCalendlyCta(page)).toHaveCount(1);
    await annotatedCalendlyCta(page).dispatchEvent('click');

    await expect.poll(() => page.evaluate(() => (window as any).__popupUrl)).toBeTruthy();
    expect(page.url()).toContain(POST); // no navigation away

    const popupUrl = new URL(await page.evaluate(() => (window as any).__popupUrl));
    expect(popupUrl.origin + popupUrl.pathname).toBe('https://calendly.com/lucaberton/');
    expect(popupUrl.searchParams.get('hide_gdpr_banner')).toBe('1');
    expect(popupUrl.searchParams.get('utm_source')).toBe('lucaberton.com');
    expect(popupUrl.searchParams.get('utm_medium')).toBe('site');
    expect(popupUrl.searchParams.get('utm_campaign')).toBe('self_hosted_agents'); // topic cluster of POST
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
    expect(events[ctaIdx].topic_cluster).toBe('self_hosted_agents');
    expect(events[ctaIdx].original_landing_page).toBe(POST);
    expect(events[startIdx].booking_source).toBe('calendly_popup');
    expect(events[startIdx].booking_type).toBe('discovery_call');
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
    expect(events.find((e) => e.event === 'consulting_cta_click')?.cta_variant).toBe('inline_calendly_link');
  });

  test('falls back to native navigation when the widget fails to load', async ({ page }) => {
    const events = await recordEvents(page);
    await stubCalendlyAssets(page, { fail: true });
    await page.route('https://calendly.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>calendly stub</title>' }),
    );
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    const navigation = page.waitForRequest((req) => req.url().startsWith('https://calendly.com/lucaberton/'));
    await annotatedCalendlyCta(page).dispatchEvent('click');
    const request = await navigation;

    expect(new URL(request.url()).searchParams.get('utm_source')).toBe('lucaberton.com');
    await expect.poll(() => events.map((e) => e.event)).toContain('booking_start');
    expect(events.find((e) => e.event === 'booking_start')?.booking_source).toBe('calendly_native_fallback');
  });

  test('modifier-click keeps the native link (no popup, widget never loaded)', async ({ page }) => {
    await stubCalendlyAssets(page);
    await page.goto(POST, { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      const a = document.querySelector<HTMLAnchorElement>('a[data-track-event="consulting_cta_click"][data-tp-cta-variant="schedule_free_assessment"]')!;
      // Cancel on window (after document listeners) so the browser opens no tab.
      window.addEventListener('click', (e) => e.preventDefault(), { once: true });
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
      return { popupUrl: (window as any).__popupUrl, widgetLoaded: typeof (window as any).Calendly !== 'undefined' };
    });
    expect(result.popupUrl).toBeUndefined();
    expect(result.widgetLoaded).toBe(false);
  });
});
