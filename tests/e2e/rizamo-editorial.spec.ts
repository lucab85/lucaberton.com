import { test, expect } from '@playwright/test';

test('Rizamo overview includes the supplied referral link, disclosure and discount', async ({ page }) => {
  await page.goto('/blog/zernio-vs-publer-vs-postiz-social-media-management/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Rizamo: Another API-First Option to Evaluate' })).toBeVisible();
  await expect(page.locator('a[href="https://docs.rizamo.com/"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://rizamo.com/pricing/"]').first()).toBeVisible();
  await expect(page.getByText('This section is a documentation-based overview, not a hands-on review', { exact: false })).toBeVisible();
  const link = page.locator('a[data-tp-offer-id="rizamo_affiliate"]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', 'https://refer.rizamo.com/luca');
  await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
  await expect(link).toHaveAttribute('data-track-event', 'affiliate_click');
  await expect(link).toHaveAttribute('data-tp-company', 'rizamo');
  await expect(link).toHaveAttribute('data-tp-offer-type', 'affiliate');
  await expect(link).toHaveAttribute('data-tp-cta-position', 'inline');
  await expect(link).toHaveAttribute('data-tp-cta-variant', 'contextual_link');
  await expect(page.getByText('LUCA10OFF', { exact: true })).toBeVisible();
  const disclosure = page.locator('[aria-label="Affiliate disclosure"]').first();
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText('We earn commissions when you shop through the links below');
  expect(await disclosure.evaluate(el => {
    const target = document.querySelector('a[data-tp-offer-id="rizamo_affiliate"]');
    return !!target && !!(el.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await expect(page.locator('a[href*="partners.dub.co/rizamo"], a[href*="rs.mail.dub.co"]')).toHaveCount(0);
});
