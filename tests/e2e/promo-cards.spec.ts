import { test, expect } from '@playwright/test';

/**
 * Time-boxed partner/affiliate cards (BlogPromoCard `validUntil`): shown with
 * canonical affiliate_click tracking while the offer is live, gone after it
 * expires. Written to stay correct on both sides of the date.
 */

const NORDIC_VALID_UNTIL = new Date('2026-10-14T23:59:59');

test.describe('contextual affiliate cards', () => {
  const placements = [
    { post: '/blog/connecting-hermes-agent-to-discord/', company: 'racknerd', offerId: 'racknerd_vps_4gb' },
    { post: '/blog/hermes-agent-troubleshooting/', company: 'racknerd', offerId: 'racknerd_vps_4gb' },
    { post: '/blog/google-stitch-pomelli-opal-whisk-ai-tools-2026/', company: 'atoms', offerId: 'atoms_luca10' },
    { post: '/blog/proteinlens-vibe-coding-on-azure/', company: 'atoms', offerId: 'atoms_luca10' },
    { post: '/blog/underrated-ai-tools-wispr-flow-alternatives-2026/', company: 'pocket', offerId: 'pocket_launch' },
    { post: '/blog/aws-summit-amsterdam-2026-startup-theatre-anthropic/', company: 'flatpay', offerId: 'flatpay_partner_referral' },
    { post: '/blog/devops-roadmap-2026-skills-tools-career/', company: 'linux_foundation', offerId: 'linux_foundation_training' },
  ];
  for (const { post, company, offerId } of placements) {
    test(`${company} card on ${post}`, async ({ page }) => {
      await page.goto(post, { waitUntil: 'domcontentloaded' });
      const card = page.locator(`a[data-track-event="affiliate_click"][data-tp-offer-id="${offerId}"]`);
      await expect(card).toHaveCount(1);
      await expect(card).toHaveAttribute('data-tp-company', company);
      await expect(card).toHaveAttribute('data-tp-offer-type', 'affiliate');
      await expect(card).toHaveAttribute('rel', /sponsored/);
      await expect(card).toContainText('(Affiliate)');
    });
  }
});

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
