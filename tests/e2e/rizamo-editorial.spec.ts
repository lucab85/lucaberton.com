import { test, expect } from '@playwright/test';

test('Rizamo overview is sourced and does not expose an unverified affiliate link', async ({ page }) => {
  await page.goto('/blog/zernio-vs-publer-vs-postiz-social-media-management/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Rizamo: Another API-First Option to Evaluate' })).toBeVisible();
  await expect(page.locator('a[href="https://docs.rizamo.com/"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://rizamo.com/pricing/"]').first()).toBeVisible();
  await expect(page.getByText('This section is a documentation-based overview, not a hands-on review', { exact: false })).toBeVisible();
  await expect(page.locator('a[data-tp-company="rizamo"], a[data-tp-offer-id="rizamo_affiliate"], a[href*="partners.dub.co/rizamo"], a[href*="rs.mail.dub.co"]')).toHaveCount(0);
});
