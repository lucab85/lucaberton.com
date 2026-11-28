import { test, expect, type Page } from '@playwright/test';

/**
 * Focused CTAs on the Claude Code / Codex error posts (src/utils/postCtaPlans.ts):
 * the two org-policy posts show one team-rollout box right after the fix,
 * the two individual-user posts show one softer offer, and none of them
 * carries the usual stack (topic banner, sticky bar, doctor strip, product
 * banner, newsletter card, course card, paid-offer cards).
 */

type TrackedEvent = { event: string } & Record<string, unknown>;

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
    // Keep the page: clicks are tracked, links do not navigate.
    document.addEventListener('click', (e) => e.preventDefault());
  });
  return recorded;
}

const TOPIC_BANNER = 'body > div[class*="bg-gradient-to-r"]';
const BOX = 'aside[data-team-rollout-box]';

async function expectNoStack(page: Page) {
  await expect(page.locator(TOPIC_BANNER)).toHaveCount(0);
  await expect(page.locator('#sticky-cta')).toHaveCount(0);
  await expect(page.locator('#udienza-slot')).toHaveCount(0);
  await expect(page.locator('[data-sales-offers]')).toHaveCount(0);
  await expect(page.locator('#article-content a[href^="https://www.copypastelearn.com/courses/"]')).toHaveCount(0);
}

const TEAM_POSTS = [
  {
    slug: 'claude-code-remote-control-enable-2026',
    fix: 'how-an-admin-enables-it',
    next: 'the-trusted-devices-layer-beta',
  },
  {
    slug: 'fix-claude-code-subscription-disabled-copilot-credit-limit',
    fix: 'fix-claude-code-subscription-access-disabled',
    next: 'claude-code-authentication-precedence',
  },
];

test.describe('team-rollout box on the org-policy posts', () => {
  for (const { slug, fix, next } of TEAM_POSTS) {
    test(`one box after the fix, nothing else, on ${slug}`, async ({ page }) => {
      await page.goto(`/blog/${slug}/`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(BOX)).toHaveCount(1);
      await expectNoStack(page);
      await expect(page.locator('aside[data-product-banner]')).toHaveCount(0);
      await expect(page.locator('form.newsletter-inline')).toHaveCount(0);

      // Right after the fix section: after its H2, before the next H2.
      const placed = await page.evaluate(({ fix, next, box }) => {
        const b = document.querySelector(box)!;
        const f = document.getElementById(fix)!;
        const n = document.getElementById(next)!;
        return !!(f.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          !!(b.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING);
      }, { fix, next, box: BOX });
      expect(placed).toBe(true);

      const links = page.locator(`${BOX} a[data-track-event="offer_click"]`);
      await expect(links).toHaveCount(4);
      await expect(page.locator(`${BOX} a[data-tp-placement="post_solution"]`)).toHaveCount(4);

      for (const offer of ['claude_code_teams_seat', 'claude_code_teams_cohort']) {
        const url = new URL((await page.locator(`${BOX} a[data-tp-offer="${offer}"]`).getAttribute('href'))!);
        expect(url.hostname).toBe('www.openempower.com');
        expect(url.searchParams.get('utm_source')).toBe('lucaberton.com');
        expect(url.searchParams.get('utm_medium')).toBe('referral');
        expect(url.searchParams.get('utm_campaign')).toBe('claude-code-teams');
        expect(url.searchParams.get('utm_content')).toBe(slug);
      }
      expect(await page.locator(`${BOX} a[data-tp-offer="claude_code_teams_seat"]`).getAttribute('href'))
        .toContain('/workshops/claude-code-for-teams');
      expect(await page.locator(`${BOX} a[data-tp-offer="claude_code_teams_cohort"]`).getAttribute('href'))
        .toContain('/book-a-call');
      await expect(page.locator(`${BOX} a[data-tp-offer="claude_code_guardrails_pack"]`))
        .toHaveAttribute('href', '/claude-code-guardrails-pack/');

      const mail = (await page.locator(`${BOX} a[data-tp-offer="forward_to_admin"]`).getAttribute('href'))!;
      expect(mail.startsWith('mailto:?subject=')).toBe(true);
      expect(decodeURIComponent(mail)).toContain(`https://lucaberton.com/blog/${slug}/`);

      await expect(page.locator(BOX)).toContainText('€490');
      await expect(page.locator(BOX)).toContainText('€4,500');
    });
  }

  test('a box click fires offer_click with offer and placement', async ({ page }) => {
    const events = await recordEvents(page);
    await page.goto('/blog/claude-code-remote-control-enable-2026/', { waitUntil: 'domcontentloaded' });
    await page.locator(`${BOX} a[data-tp-offer="claude_code_teams_seat"]`).click();
    await expect.poll(() => events.map((e) => e.event)).toContain('offer_click');
    const click = events.find((e) => e.event === 'offer_click')!;
    expect(click.offer).toBe('claude_code_teams_seat');
    expect(click.placement).toBe('post_solution');
    expect(click.page_path).toBe('/blog/claude-code-remote-control-enable-2026/');
  });
});

test.describe('one softer offer on the individual-user posts', () => {
  test('ECONNRESET post: the Guardrails Pack banner only', async ({ page }) => {
    await page.goto('/blog/claude-code-econnreset-fix/', { waitUntil: 'domcontentloaded' });
    await expectNoStack(page);
    await expect(page.locator(BOX)).toHaveCount(0);
    await expect(page.locator('aside[data-product-banner]')).toHaveCount(1);
    await expect(page.locator('form.newsletter-inline')).toHaveCount(0);
  });

  test('Codex device-code post: the newsletter card only', async ({ page }) => {
    await page.goto('/blog/codex-device-code-auth-chatgpt-security-2026/', { waitUntil: 'domcontentloaded' });
    await expectNoStack(page);
    await expect(page.locator(BOX)).toHaveCount(0);
    await expect(page.locator('aside[data-product-banner]')).toHaveCount(0);
    await expect(page.locator('form.newsletter-inline')).toHaveCount(1);
  });
});

test.describe('no analytics from local hosts', () => {
  test('on 127.0.0.1 gtag sends nothing, while the dataLayer still records events', async ({ page }) => {
    const collects: string[] = [];
    page.on('request', (r) => {
      if (/google-analytics\.com\/(g\/)?collect|analytics\.google\.com\/g\/collect/.test(r.url())) collects.push(r.url());
    });
    const events = await recordEvents(page);
    await page.goto('/blog/claude-code-remote-control-enable-2026/', { waitUntil: 'load' });
    expect(await page.evaluate(() => (window as any).__lucaNoAnalytics)).toBe(true);
    await page.locator(`${BOX} a[data-tp-offer="claude_code_teams_cohort"]`).click();
    await expect.poll(() => events.map((e) => e.event)).toContain('offer_click');
    // No gtag('config') or gtag('event') ever reached the dataLayer.
    const gtagCalls = await page.evaluate(() =>
      Array.from((window as any).dataLayer as any[]).filter((e) => e && typeof e === 'object' && typeof e.length === 'number' && (e[0] === 'config' || e[0] === 'event')).length,
    );
    expect(gtagCalls).toBe(0);
    expect(collects).toEqual([]);
  });
});
