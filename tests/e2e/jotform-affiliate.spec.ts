import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const JOTFORM_ASSETS = join(process.cwd(), 'src/assets/affiliate/jotform');
test('All five Jotform creative assets are committed', () => {
  for (const n of [2, 3, 4, 11, 13]) {
    expect(existsSync(join(JOTFORM_ASSETS, `Jotform_Banner_${n}.png`))).toBe(true);
  }
});

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
    await expect(offer).toHaveText('Black Friday: 60% off eligible annual plans (first year only; ends November 30, 2026).');
    await expect(offer).toHaveAttribute('href', 'https://www.jotform.com/discounts/black-friday/?partner=lucaberton');
    await expect(offer).toHaveAttribute('data-tp-offer-id', 'jotform_black_friday_2026');
    await expect(offer).toHaveAttribute('rel', /\bsponsored\b/);
    await page.clock.setSystemTime(new Date('2026-11-30T07:59:59Z'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(offer).toHaveText('Partner offer: 50% off annual plans.');
    await expect(offer).toHaveAttribute('href', 'https://www.jotform.com/pricing/?partner=lucaberton');
    await expect(offer).toHaveAttribute('data-tp-offer-id', 'jotform_partner_offer');
    await expect(link).toHaveAttribute('href', 'https://www.jotform.com/pricing/?partner=lucaberton');
  });
}

test('Jotform AI Agents contextual referral uses dedicated tracking link', async ({ page }) => {
  await page.goto('/blog/n8n-workflow-automation-self-hosted-kubernetes-2026/', { waitUntil: 'domcontentloaded' });
  const link = page.locator('a[data-tp-offer-id="jotform_ai_agents"]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', 'https://www.jotform.com/ai/agents/?partner=lucaberton');
  await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
  await expect(link).toHaveAttribute('data-track-event', 'affiliate_click');
  await expect(page.locator('[aria-label="Affiliate disclosure"]').first()).toBeVisible();
});

test('Jotform graphic switches to evergreen at campaign cutoff', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install({ time: new Date('2026-11-26T12:00:00Z') });
  await page.goto('/blog/40-ai-web-design-tools-ui-inspiration-2026/', { waitUntil: 'domcontentloaded' });
  const creative = page.locator('jotform-creative[data-variant="forms"]');
  const link = creative.locator('a');
  await expect(creative).toBeVisible();
  await expect(link).toHaveAttribute('data-tp-offer-id', 'jotform_black_friday_banner');
  await expect(link).toHaveAttribute('href', 'https://www.jotform.com/discounts/black-friday/?partner=lucaberton');
  await expect(creative.locator('source')).toHaveAttribute('srcset', /Jotform_Banner_3\./);
  await expect(creative.locator('img')).toHaveAttribute('src', /Jotform_Banner_2\./);
  await expect(creative.locator('source')).toHaveAttribute('width', '3880');
  // The creative is loading="lazy": bring it into view so the browser fetches it.
  await creative.scrollIntoViewIfNeeded();
  await expect.poll(() => creative.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.clock.setSystemTime(new Date('2026-11-30T07:59:59Z'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(link).toHaveAttribute('data-tp-offer-id', 'jotform_forms_banner');
  await expect(link).toHaveAttribute('href', 'https://www.jotform.com/?partner=lucaberton');
  await expect(creative.locator('source')).toHaveAttribute('srcset', /Jotform_Banner_11\./);
  await expect(creative.locator('img')).toHaveAttribute('src', /Jotform_Banner_13\./);
  await expect(creative.locator('source')).toHaveAttribute('width', '2400');
});

test('Jotform AI Agents graphic has its own affiliate link', async ({ page }) => {
  await page.goto('/blog/n8n-workflow-automation-self-hosted-kubernetes-2026/', { waitUntil: 'domcontentloaded' });
  const creative = page.locator('jotform-creative[data-variant="ai_agents"]');
  await expect(creative).toBeVisible();
  await expect(creative.locator('a')).toHaveAttribute('href', 'https://www.jotform.com/ai/agents/?partner=lucaberton');
  await expect(creative.locator('img')).toHaveAttribute('src', /Jotform_Banner_4\./);
});
