import { test, expect } from '@playwright/test';

for (const path of ['/partner-with-luca/', '/blog/40-ai-web-design-tools-ui-inspiration-2026/']) {
  test('Jotform text-only affiliate offer and expiry on ' + path, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-26T12:00:00+01:00') });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const link = page.locator('a[data-tp-offer-id="jotform_affiliate"]');
    const offer = page.locator('[data-jotform-offer]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://www.jotform.com/pricing/?partner=lucaberton');
    await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
    await expect(link).toHaveAttribute('data-track-event', 'affiliate_click');
    await expect(link).toHaveAttribute('data-tp-company', 'jotform');
    await expect(link).toHaveAttribute('data-tp-offer-type', 'affiliate');
    await expect(page.locator('[aria-label="Affiliate disclosure"]').first()).toBeVisible();
    await expect(offer).toHaveText('Black Friday: 60% off eligible annual plans through November 30, 2026.');
    await page.clock.setSystemTime(new Date('2026-12-01T00:00:00+01:00'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(offer).toHaveText('Partner offer: 50% off annual plans.');
    await expect(link).toHaveAttribute('href', 'https://www.jotform.com/pricing/?partner=lucaberton');
  });
}
