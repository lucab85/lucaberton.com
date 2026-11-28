import { test, expect, type Page } from '@playwright/test';
import { claudeCodeTeamKit, planLive } from '../../src/data/claudeCodeTeamKit';

/**
 * /claude-code-team-kit/ (src/data/claudeCodeTeamKit.ts): while a Stripe
 * Payment Link is empty, that plan's buttons say "Request access", go to the
 * contact page and the page has no Offer in its JSON-LD. Once a link is set,
 * the buttons go to Stripe and a Product with that Offer appears. Every buy
 * button fires offer_click; the thanks page fires kit_checkout_complete.
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

const PAGE = claudeCodeTeamKit.page;
const plans = [
  { key: 'individual', plan: claudeCodeTeamKit.plans.individual },
  { key: 'team', plan: claudeCodeTeamKit.plans.team },
] as const;

async function jsonLdText(page: Page): Promise<string> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.join('\n');
}

test.describe('Claude Code Team Kit page', () => {
  test('renders the hero, both prices and the independence note', async ({ page }) => {
    const res = await page.goto(PAGE);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Claude Code');
    const pricing = page.locator('#pricing');
    await expect(pricing).toContainText('€29');
    await expect(pricing).toContainText('€149');
    await expect(pricing).toContainText('VAT may apply at checkout');
    await expect(page.locator('[data-team-kit-independent]')).toContainText('not affiliated with or endorsed by Anthropic');
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  });

  for (const { key, plan } of plans) {
    test(`${key} buttons follow the Payment Link setting`, async ({ page }) => {
      await page.goto(PAGE);
      const buttons = page.locator(`a[data-team-kit-buy="${key}"]`);
      await expect(buttons).toHaveCount(3);
      for (const button of await buttons.all()) {
        await expect(button).toHaveAttribute('data-track-event', 'offer_click');
        await expect(button).toHaveAttribute('data-tp-offer', plan.offer);
        if (planLive(plan)) {
          await expect(button).toHaveAttribute('href', plan.paymentLinkUrl.trim());
        } else {
          await expect(button).toHaveAttribute('href', '/contact/?topic=claude-code-team-kit');
          await expect(button).toContainText('Request access');
        }
      }
    });
  }

  test('JSON-LD has an Offer only for plans with a Payment Link', async ({ page }) => {
    await page.goto(PAGE);
    const ld = await jsonLdText(page);
    const live = plans.filter(({ plan }) => planLive(plan));
    if (live.length === 0) {
      expect(ld).not.toContain('"Offer"');
      expect(ld).not.toContain('"Product"');
    } else {
      expect(ld).toContain('"Product"');
      for (const { plan } of live) expect(ld).toContain(`"price":"${plan.price}"`);
      expect(ld).toContain('"priceCurrency":"EUR"');
    }
  });

  test('a buy button fires offer_click with offer and placement', async ({ page }) => {
    const events = await recordEvents(page);
    await page.goto(PAGE);
    await page.locator('#pricing a[data-team-kit-buy="team"]').click();
    await expect.poll(() => events.map((e) => e.event)).toContain('offer_click');
    const click = events.find((e) => e.event === 'offer_click')!;
    expect(click.offer).toBe('team-kit-team');
    expect(click.placement).toBe('inline');
  });

  test('thanks page is noindex and fires kit_checkout_complete', async ({ page }) => {
    const events = await recordEvents(page);
    const res = await page.goto(claudeCodeTeamKit.thanksPage);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Payment received');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('[data-page-context] a[href^="/contact/"]')).toHaveCount(1);
    await expect.poll(() => events.map((e) => e.event)).toContain('kit_checkout_complete');
    const done = events.find((e) => e.event === 'kit_checkout_complete')!;
    expect(done.value).toBeUndefined();
  });
});
