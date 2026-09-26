import { test, expect, type Page } from '@playwright/test';

/**
 * /conferences/ timeline: role badges must reflect Luca's actual role (an
 * attended event must never claim "Speaker"), upcoming badges must follow the
 * real date, and the list is ordered newest first.
 */

// Timeline cards only (bg-white/5); the featured-talk cards above the timeline
// also contain event names but intentionally carry no role badge.
const TIMELINE_CARD = 'div.group[class~="bg-white/5"]';
const card = (page: Page, name: string) =>
  page.locator(TIMELINE_CARD).filter({ has: page.getByText(name, { exact: true }) }).first();

test.describe('conferences timeline', () => {
  test('confirmed talks carry their role badge', async ({ page }) => {
    await page.goto('/conferences/', { waitUntil: 'domcontentloaded' });
    await expect(card(page, 'Nordic APIs Platform Summit 2026')).toContainText('Speaker');
    await expect(card(page, 'Clarkson Hyde Global Amsterdam 2026')).toContainText('Keynote');
    await expect(card(page, 'Cloud Native Rejekts EU 2026')).toContainText('MC');
    await expect(card(page, 'AGNTCon + MCPCon Europe 2026')).toContainText('Media partner');
  });

  test('attended events do not claim a speaking role', async ({ page }) => {
    await page.goto('/conferences/', { waitUntil: 'domcontentloaded' });
    for (const name of ['TNW Conference', 'Fosdem 2026', 'IBC2026']) {
      const c = card(page, name);
      await expect(c).toBeVisible();
      await expect(c).not.toContainText('Speaker');
    }
    // Attended events with a write-up still link to it.
    await expect(card(page, 'IBC2026').getByRole('link', { name: /Recap/ })).toHaveAttribute('href', '/blog/ibc-2026-content-delivery-infrastructure/');
  });

  test('timeline is ordered newest first', async ({ page }) => {
    await page.goto('/conferences/', { waitUntil: 'domcontentloaded' });
    const dates = await page.locator(`${TIMELINE_CARD} .bg-white\\/10.text-cyan-400`).allTextContents();
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const keys = dates.map((d) => d.trim()).filter((d) => /^[A-Z][a-z]{2} \d{4}$/.test(d)).map((d) => {
      const [m, y] = d.split(' ');
      return Number(y) * 12 + MONTHS.indexOf(m);
    });
    expect(keys.length).toBeGreaterThan(40);
    expect(keys).toEqual([...keys].sort((a, b) => b - a));
  });
});
