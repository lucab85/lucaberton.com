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
    { post: '/blog/openclaw-vps-deployment-always-on-ai-agent/', company: 'racknerd', offerId: 'racknerd_vps_4gb' },
    { post: '/blog/k3s-vs-k8s-2026/', company: 'racknerd', offerId: 'racknerd_vps_4gb' },
    { post: '/blog/google-stitch-pomelli-opal-whisk-ai-tools-2026/', company: 'atoms', offerId: 'atoms_luca10' },
    { post: '/blog/proteinlens-vibe-coding-on-azure/', company: 'atoms', offerId: 'atoms_luca10' },
    { post: '/blog/underrated-ai-tools-wispr-flow-alternatives-2026/', company: 'pocket', offerId: 'pocket_launch' },
    { post: '/blog/aws-summit-amsterdam-2026-startup-theatre-anthropic/', company: 'flatpay', offerId: 'flatpay_partner_referral' },
    { post: '/blog/devops-roadmap-2026-skills-tools-career/', company: 'linux_foundation', offerId: 'linux_foundation_training' },
  ];
  for (const { post, company, offerId } of placements) {
    test(`${company} card on ${post}`, async ({ page }) => {
      // The Linux Foundation banner swaps in seasonal Awin campaigns with their
      // own offer ids; check the evergreen placement outside any campaign.
      if (company === 'linux_foundation') await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
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
  // The talk recap (nordic-apis-2026-api-guardrails-multi-tenant-ai) dropped the
  // card once the summit started; only the event overview still carries it.
  for (const post of ['/blog/nordic-apis-summit-2026-stockholm/']) {
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

/**
 * CopyPasteLearn course cards (BlogPromoCard variant="copypastelearn"): Luca's
 * own product, so one card per post, a followed link (no nofollow/sponsored),
 * no affiliate label or affiliate_click event, and UTM tags that name the
 * course key. Any affiliate card already on the post stays.
 */
test.describe('copypastelearn course cards', () => {
  // The Claude Code / Codex error posts in src/utils/postCtaPlans.ts carry one
  // focused offer instead (tests/e2e/focused-offers.spec.ts).
  const placements = [
    { post: '/blog/karpathy-claude-md-llm-coding-principles-2026/', course: 'coding-agents' },
    { post: '/blog/claude-code-opentelemetry-monitoring-coding-agents/', course: 'otel-agents' },
    { post: '/blog/claude-code-enterprise-setup-authentication-mcp-guide/', course: 'mcp' },
    { post: '/blog/hermes-agent-oracle-cloud-free-tier-deployment/', course: 'ai-agent' },
    { post: '/blog/hermes-agent-troubleshooting/', course: 'ai-agent' },
    { post: '/blog/connecting-hermes-agent-to-discord/', course: 'ai-agent' },
  ];
  for (const { post, course } of placements) {
    test(`${course} course card on ${post}`, async ({ page }) => {
      await page.goto(post, { waitUntil: 'domcontentloaded' });
      const card = page.locator('#article-content a[href^="https://www.copypastelearn.com/courses/"]');
      await expect(card).toHaveCount(1);
      const url = new URL((await card.getAttribute('href'))!);
      expect(url.searchParams.get('utm_source')).toBe('lucaberton.com');
      expect(url.searchParams.get('utm_medium')).toBe('referral');
      expect(url.searchParams.get('utm_campaign')).toBe('group-crosslink');
      expect(url.searchParams.get('utm_content')).toBe(course);
      await expect(card).not.toHaveAttribute('rel', /nofollow|sponsored/);
      await expect(card).not.toHaveAttribute('data-track-event', /.*/);
      await expect(card).not.toContainText('(Affiliate)');
      await expect(card).toContainText('Start the free lesson');
    });
  }
});
