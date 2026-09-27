import { test, expect, type Page } from '@playwright/test';

/**
 * Site-wide announcement banner chosen by the page's topic cluster
 * (src/utils/topicBanners.ts): consulting offers for leader-intent clusters
 * (same tab, consulting_cta_click), the newsletter for engineer clusters,
 * the Claude Code Masterclass for Claude Code posts and non-blog pages.
 */

// AnnouncementBanner root: a direct <body> child with the gradient background.
const BANNER = 'body > div[class*="bg-gradient-to-r"]';
const banner = (page: Page) => page.locator(`${BANNER} a[href]`).first();

test.describe('topic-aware announcement banner', () => {
  test('agent posts pitch the agent platform assessment, tracked, same tab', async ({ page }) => {
    await page.goto('/blog/hermes-agent-oracle-cloud-free-tier-deployment/', { waitUntil: 'domcontentloaded' });
    const link = banner(page);
    await expect(link).toHaveAttribute('href', '/production-ai-assessment/');
    await expect(link).toHaveAttribute('data-track-event', 'consulting_cta_click');
    await expect(link).toHaveAttribute('data-tp-target-offer', 'agent_platform_assessment');
    await expect(link).toHaveAttribute('data-tp-cta-position', 'top_banner');
    await expect(link).not.toHaveAttribute('target', '_blank');
  });

  test('Claude Code posts keep the Masterclass', async ({ page }) => {
    await page.goto('/blog/claude-code-econnreset-fix/', { waitUntil: 'domcontentloaded' });
    const link = banner(page);
    await expect(link).toHaveAttribute('href', /udemy\.com\/course\/claude-code-masterclass/);
    await expect(link).toHaveAttribute('target', '_blank');
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
