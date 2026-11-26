import { test, expect } from '@playwright/test';

test('Udemy Impact placement stays absent without publisher configuration', async ({ page }) => {
  await page.goto('/blog/github-actions-kubernetes-deploy-tutorial/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('udemy-impact-banner')).toHaveCount(0);
  await expect(page.locator('a[data-tp-offer-id^="udemy_impact_"]')).toHaveCount(0);
});
