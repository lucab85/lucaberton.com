import { test, expect } from '@playwright/test';

test.describe('partner with Luca', () => {
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
