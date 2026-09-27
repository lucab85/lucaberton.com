import { test, expect } from '@playwright/test';

/**
 * Time-boxed partner/affiliate cards (BlogPromoCard `validUntil`): shown with
 * canonical affiliate_click tracking while the offer is live, gone after it
 * expires. Written to stay correct on both sides of the date.
 */

const NORDIC_VALID_UNTIL = new Date('2026-10-14T23:59:59');

test.describe('time-boxed promo cards', () => {
  for (const post of ['/blog/nordic-apis-summit-2026-stockholm/', '/blog/nordic-apis-2026-api-guardrails-multi-tenant-ai/']) {
    test(`Nordic APIs partner card on ${post}`, async ({ page }) => {
      await page.goto(post, { waitUntil: 'domcontentloaded' });
      const card = page.locator('a[data-track-event="affiliate_click"][data-tp-offer-id="nordic_apis_summit_2026"]');
      if (new Date() > NORDIC_VALID_UNTIL) {
        await expect(card).toHaveCount(0);
        return;
      }
      await expect(card).toHaveCount(1);
      await expect(card).toHaveAttribute('data-tp-company', 'nordic_apis');
      await expect(card).toHaveAttribute('data-tp-offer-type', 'partner');
      await expect(card).toHaveAttribute('rel', /sponsored/);
      await expect(card).toContainText('napi26-luca');
    });
  }
});
