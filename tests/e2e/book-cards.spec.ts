import { test, expect } from '@playwright/test';

/**
 * Book cards (src/components/BookCard.astro, src/data/books.ts): the /books/
 * catalogue (featured Claude Code Masterclass, shelves by topic), the home
 * page books section and MasterclassFeature on /courses/.
 */

const CARD = '[data-book-card]';

test.describe('/books/ catalogue', () => {
  test('featured Claude Code Masterclass with the coupon link and team packs', async ({ page }) => {
    await page.goto('/books/', { waitUntil: 'domcontentloaded' });
    const featured = page.locator('[data-featured-book]');
    await expect(featured).toHaveCount(1);
    await expect(featured.locator('img')).toHaveAttribute('alt', 'Cover of Claude Code Masterclass');
    const leanpub = featured.locator('a[href^="https://leanpub.com/claude-code"]').first();
    expect(new URL((await leanpub.getAttribute('href'))!).pathname).toBe('/claude-code/c/lucaberton');
    await expect(featured.locator('a[href="https://amzn.to/4vpWeSx"]')).toHaveCount(1);
    const team = new URL((await featured.locator('a[href*="#team-discounts"]').getAttribute('href'))!);
    expect(team.pathname).toBe('/claude-code');
  });

  test('four shelves; every card has a cover, a title and a purchase link', async ({ page }) => {
    await page.goto('/books/', { waitUntil: 'domcontentloaded' });
    for (const id of ['shelf-ai', 'shelf-kubernetes', 'shelf-ansible', 'shelf-linux-cloud']) {
      await expect(page.locator(`section#${id} ${CARD}`).first()).toBeVisible();
    }
    const cards = page.locator(`[data-book-shelf] ${CARD}`);
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(28);
    for (let i = 0; i < n; i++) {
      const card = cards.nth(i);
      const title = (await card.locator('.bc-title').textContent())!.trim();
      await expect(card.locator('img')).toHaveAttribute('alt', `Cover of ${title}`);
      await expect(card.locator('img')).toHaveAttribute('width', /^\d+$/);
      const buy = card.locator('a[href^="https://leanpub.com/"], a[href*="amzn.to"], a[href*="link.amazon"]');
      expect(await buy.count()).toBeGreaterThan(0);
    }
  });

  test('Ansible Automation Platform By Example is on the Ansible shelf; retired ebooks are not listed', async ({ page }) => {
    await page.goto('/books/', { waitUntil: 'domcontentloaded' });
    const aap = page.locator(`#shelf-ansible ${CARD}`, { hasText: 'Ansible Automation Platform By Example' });
    await expect(aap).toHaveCount(1);
    const buy = new URL((await aap.locator('a[href*="leanpub.com/Ansible-Automation-Platform"]:not([href*="#team-discounts"])').getAttribute('href'))!);
    expect(buy.pathname).toBe('/Ansible-Automation-Platform/c/lucaberton');
    const team = new URL((await aap.locator('a[href*="#team-discounts"]').getAttribute('href'))!);
    expect(team.pathname).toBe('/Ansible-Automation-Platform');
    await expect(page.locator('a[href*="leanpub.com/ansible-for-kubernetes-by-examples"]')).toHaveCount(0);
    await expect(page.locator('a[href*="leanpub.com/ansible-for-vmware-by-examples"]')).toHaveCount(0);
    // The Apress editions stay.
    await expect(page.locator(CARD, { hasText: 'Ansible for Kubernetes by Example' })).toHaveCount(1);
    await expect(page.locator(CARD, { hasText: 'Ansible for VMware by Examples' })).toHaveCount(1);
  });

  test('no horizontal overflow on a phone, and buttons are at least 44px tall', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/books/', { waitUntil: 'load' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const heights = await page.locator(`[data-book-shelf] ${CARD} a, [data-featured-book] a`).evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height),
    );
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    await ctx.close();
  });
});

test('home page shows six book cards and a link to /books/', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator(`[data-books-section] ${CARD}`)).toHaveCount(6);
  await expect(page.locator('[data-books-section] a[href="/books/"]')).toHaveCount(1);
});

test('MasterclassFeature book card keeps its Leanpub and Amazon links', async ({ page }) => {
  await page.goto('/courses/', { waitUntil: 'domcontentloaded' });
  const card = page.locator(`.masterclass-book${CARD}`);
  await expect(card).toHaveCount(1);
  const leanpub = card.locator('a', { hasText: 'Get on Leanpub' });
  expect(new URL((await leanpub.getAttribute('href'))!).pathname).toBe('/claude-code/c/lucaberton');
  await expect(leanpub).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(card.locator('a[href="https://amzn.to/4vpWeSx"]')).toHaveCount(1);
});
