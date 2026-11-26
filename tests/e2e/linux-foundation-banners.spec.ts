import { test, expect } from '@playwright/test';

const evergreen = 's=3740967&v=85919&q=500799&r=1937397';

for (const placement of [
  { path: '/blog/devops-roadmap-2026-skills-tools-career/', audience: 'linux' },
  { path: '/blog/kubecon-japan-2026-cncf-japan-briefing/', audience: 'cncf' },
  { path: '/blog/kubecon-japan-2026-ecosystem/', audience: 'cncf' },
  { path: '/blog/kubecon-japan-2026-opening-keynote/', audience: 'cncf' },
  { path: '/blog/kubecon-2026-pepijn-oomen-sovereign-cloud/', audience: 'cncf' },
  { path: '/blog/rocky-linux-10-rhel-alternative/', audience: 'linux' },
]) {
  test('Linux Foundation banner consent and fallback: ' + placement.path, async ({ page }) => {
    await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
    let requests = 0;
    await page.route('https://www.awin1.com/cshow.php?**', async route => {
      if (route.request().url().includes(evergreen)) requests++;
      await route.abort();
    });
    await page.goto(placement.path, { waitUntil: 'domcontentloaded' });
    const banner = page.locator('lf-training-banner[data-audience="' + placement.audience + '"]');
    const link = banner.locator('a');
    const image = banner.locator('img');
    await expect(banner).toHaveCount(1);
    await expect(page.locator('[aria-label="Affiliate disclosure"]').first()).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.awin1.com/cread.php?' + evergreen);
    await expect(link).toHaveAttribute('data-tp-offer-id', 'linux_foundation_training');
    await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
    await expect(image).not.toHaveAttribute('src', /.+/);
    expect(requests).toBe(0);
    await banner.getByRole('button', { name: 'Allow and load advertising banner' }).click();
    await expect(image).toHaveAttribute('src', 'https://www.awin1.com/cshow.php?' + evergreen);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => requests).toBe(1);
  });
}

test('scheduled creative switches at boundaries and returns to evergreen', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.goto('/blog/devops-roadmap-2026-skills-tools-career/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await customElements.whenDefined('lf-training-banner');
    const original = document.querySelector('lf-training-banner')!;
    const clone = original.cloneNode(true) as HTMLElement;
    clone.id = 'schedule-fixture';
    clone.dataset.campaigns = JSON.stringify([
      { start: '2030-01-01T00:01:00Z', end: '2030-01-01T00:02:00Z',
        creative: { id: '1', group: '1', width: 600, height: 300, label: 'Test creative', offerId: 'fixture_offer' } },
      { start: '2030-01-01T00:02:00Z', end: '2030-01-01T00:03:00Z',
        creative: { id: '2', group: '1', width: 600, height: 300, label: 'Second test creative', offerId: 'fixture_second' } },
    ]);
    original.replaceWith(clone);
  });
  const link = page.locator('#schedule-fixture a');
  await expect(link).toHaveAttribute('data-tp-offer-id', 'linux_foundation_training');
  await page.clock.fastForward(60000);
  await expect(link).toHaveAttribute('data-tp-offer-id', 'fixture_offer');
  await page.clock.fastForward(60000);
  await expect(link).toHaveAttribute('data-tp-offer-id', 'fixture_second');
  await page.clock.fastForward(60000);
  await expect(link).toHaveAttribute('data-tp-offer-id', 'linux_foundation_training');
  await expect(page.locator('#schedule-fixture img')).not.toHaveAttribute('src', /.+/);
});

for (const fixture of [
  { path: '/blog/rocky-linux-10-rhel-alternative/', audience: 'linux', ids: ['5002160', '5002162', '5002164'] },
  { path: '/blog/kubecon-japan-2026-cncf-japan-briefing/', audience: 'cncf', ids: ['5002161', '5002163', '5002165'] },
]) {
  test('actual Awin phase rotation, consent and expiry: ' + fixture.audience, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-26T21:59:00Z') });
    const requests: string[] = [];
    await page.route('https://www.awin1.com/cshow.php?**', async route => {
      if (route.request().url().includes('v=85919')) requests.push(route.request().url());
      await route.abort();
    });
    await page.goto(fixture.path, { waitUntil: 'domcontentloaded' });
    const banner = page.locator('lf-training-banner[data-audience="' + fixture.audience + '"]');
    const link = banner.locator('a');
    const image = banner.locator('img');
    const button = banner.getByRole('button', { name: 'Allow and load advertising banner' });
    await expect(link).toHaveAttribute('href', 'https://www.awin1.com/cread.php?' + evergreen);
    const times = ['2026-11-26T22:00:00Z', '2026-11-30T00:00:00Z', '2026-12-04T00:00:00Z'];
    const phaseNames = ['black_friday', 'cyber_week', 'last_chance'];
    for (let i = 0; i < times.length; i++) {
      await page.clock.setSystemTime(new Date(times[i]));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      const query = 's=' + fixture.ids[i] + '&v=85919&q=501120&r=1937397';
      await expect(link).toHaveAttribute('href', 'https://www.awin1.com/cread.php?' + query);
      await expect(link).toHaveAttribute('data-tp-offer-id', 'linux_foundation_' + phaseNames[i] + '_' + fixture.audience);
      await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
      await expect(image).not.toHaveAttribute('src', /.+/);
      await expect(button).toBeVisible();
      expect(requests).toHaveLength(i);
      await button.click();
      await expect(image).toHaveAttribute('width', '901');
      await expect(image).toHaveAttribute('height', '501');
      await expect(image).toHaveAttribute('src', 'https://www.awin1.com/cshow.php?' + query);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => requests.length).toBe(i + 1);
    }
    await page.clock.setSystemTime(new Date('2026-12-04T23:59:00Z'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(link).toHaveAttribute('href', 'https://www.awin1.com/cread.php?' + evergreen);
    await expect(image).not.toHaveAttribute('src', /.+/);
    await expect(button).toBeVisible();
    expect(requests).toHaveLength(3);
  });
}
