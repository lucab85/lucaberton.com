import { test, expect } from '@playwright/test';

test('Coursera Impact placement stays absent without publisher configuration', async ({ page }) => {
  await page.goto('/blog/gemini-cli-complete-guide-commands-automation-2026/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('coursera-impact-banner')).toHaveCount(0);
  await expect(page.locator('a[data-tp-offer-id^="coursera_impact_"]')).toHaveCount(0);
});
