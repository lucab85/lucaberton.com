import { test, expect, type Page } from '@playwright/test';

/**
 * Site-wide announcement banner chosen by the page's topic cluster
 * (src/utils/topicBanners.ts): consulting offers for leader-intent clusters
 * (Open Empower, same tab, consulting_cta_click), the newsletter for engineer clusters,
 * and the Claude Code Masterclass on non-blog pages. Posts with a topic offer
 * (src/utils/topicOffers.ts) show no banner.
 */

// AnnouncementBanner root: a direct <body> child with the gradient background.
const BANNER = 'body > div[class*="bg-gradient-to-r"]';
const banner = (page: Page) => page.locator(`${BANNER} a[href]`).first();

test.describe('topic-aware announcement banner', () => {
  test('agent posts pitch the agent platform assessment, tracked, same tab', async ({ page }) => {
    await page.goto('/blog/hermes-agent-oracle-cloud-free-tier-deployment/', { waitUntil: 'domcontentloaded' });
    const link = banner(page);
    await expect(link).toHaveAttribute('href', 'https://www.openempower.com/services/assessment');
    await expect(link).toHaveAttribute('data-track-event', 'consulting_cta_click');
    await expect(link).toHaveAttribute('data-tp-target-offer', 'agent_platform_assessment');
    await expect(link).toHaveAttribute('data-tp-cta-position', 'top_banner');
    await expect(link).not.toHaveAttribute('target', '_blank');
  });

  test('Claude Code posts carry no top banner: their topic offer is the ebook at the end', async ({ page }) => {
    // Every claude_code post has a topic offer (src/utils/topicOffers.ts), which
    // switches the banner off; see tests/e2e/focused-offers.spec.ts.
    await page.goto('/blog/fix-claude-code-homebrew-macos-node-26-install/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator(BANNER)).toHaveCount(0);
    await expect(page.locator('aside[data-topic-offer-box] a[data-tp-offer="leanpub_claude_code"]:not([data-tp-team])')).toHaveCount(1);
  });

  test('DevOps posts offer the newsletter', async ({ page }) => {
    await page.goto('/blog/podman-vs-docker-2026/', { waitUntil: 'domcontentloaded' });
    const link = banner(page);
    await expect(link).toHaveAttribute('href', /kit\.com\/ce74a48bfa/);
    await expect(link).toHaveAttribute('data-track-event', 'email_signup_start');
    await expect(link).toHaveAttribute('data-tp-cta-position', 'top_banner');
  });

  test('non-blog pages keep the Masterclass; the homepage shows no banner', async ({ page }) => {
    await page.goto('/services/', { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toHaveAttribute('href', /claude-code-masterclass/);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator(BANNER)).toHaveCount(0);
  });
});
