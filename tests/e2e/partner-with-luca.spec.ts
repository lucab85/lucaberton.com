import { test, expect } from '@playwright/test';

test.describe('partner with Luca', () => {
  test('tracks verified commercial partner links', async ({ page }) => {
    await page.goto('/partner-with-luca/', { waitUntil: 'domcontentloaded' });
    const rootly = page.locator('#commercial-partners a[data-tp-offer-id="rootly_partner_referral"]');
    const tiiny = page.locator('#commercial-partners a[data-tp-offer-id="tiiny_host_affiliate"]');
    await expect(rootly).toHaveAttribute('href', 'https://rootly.com/ai-sre?utm_source=lucaberton&utm_medium=referral&utm_campaign=kubecon-eu-2026&utm_content=blog-recap');
    await expect(tiiny).toHaveAttribute('href', 'https://tiiny.host?fpr=luca-97b16e');
    for (const link of [rootly, tiiny]) {
      await expect(link).toHaveAttribute('data-track-event', 'affiliate_click');
      await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
    }
    await expect(page.locator('#commercial-partners')).toContainText('LUCA10');
    await page.goto('/blog/rootly-kubecon-europe-2026-ai-sre-incident-management/');
    const rootlyLinks = page.locator('a[data-tp-offer-id="rootly_partner_referral"]');
    await expect(rootlyLinks).toHaveCount(2);
    for (const link of await rootlyLinks.all()) {
      await expect(link).toHaveAttribute('href', 'https://rootly.com/ai-sre?utm_source=lucaberton&utm_medium=referral&utm_campaign=kubecon-eu-2026&utm_content=blog-recap');
      await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
    }
    await page.goto('/blog/google-stitch-pomelli-opal-whisk-ai-tools-2026/');
    const tiinyLink = page.locator('a[data-tp-offer-id="tiiny_host_affiliate"]');
    await expect(tiinyLink).toHaveCount(1);
    await expect(tiinyLink).toHaveAttribute('href', 'https://tiiny.host?fpr=luca-97b16e');
    await expect(tiinyLink).toHaveAttribute('rel', /\bsponsored\b/);
  });

  test('exposes partnership offers and a tracked inquiry form', async ({ page }) => {
    await page.goto('/partner-with-luca/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /put your product in front of engineers/i })
    ).toBeVisible();

    await expect(page.getByText('Sponsored Technical Content')).toBeVisible();
    await expect(page.getByText('YouTube Reviews & Integrations')).toBeVisible();
    await expect(page.getByText('Affiliate & Referral Partnerships')).toBeVisible();
    await expect(page.getByText('Content Licensing & Paid Media')).toBeVisible();

    const form = page.locator('#contact-form');
    await expect(form).toHaveCount(1);
    await expect(form).toHaveAttribute('data-tracking-form-id', 'partnership');

    await expect(
      page.locator('footer a[href="/partner-with-luca/"]')
    ).toHaveText('Partner');
  });
});
