import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

// JotformCreative.astro renders the image placements only once the approved
// media-kit WebP files are committed (src/assets/affiliate/jotform/README.md).
// Until then the text links are the only Jotform placements, so skip these.
const JOTFORM_ASSETS = join(process.cwd(), 'src/assets/affiliate/jotform');
const hasJotformCreatives = ['forms-wide', 'forms-compact', 'black-friday-wide', 'black-friday-compact', 'ai-agents']
  .every((name) => existsSync(join(JOTFORM_ASSETS, name + '.webp')));

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
  test.skip(!hasJotformCreatives, 'Jotform media-kit WebP files not committed yet');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install({ time: new Date('2026-11-26T12:00:00Z') });
  await page.goto('/blog/40-ai-web-design-tools-ui-inspiration-2026/', { waitUntil: 'domcontentloaded' });
  const creative = page.locator('jotform-creative[data-variant="forms"]');
  const link = creative.locator('a');
  await expect(creative).toBeVisible();
  await expect(link).toHaveAttribute('data-tp-offer-id', 'jotform_black_friday_banner');
  await expect(link).toHaveAttribute('href', 'https://www.jotform.com/discounts/black-friday/?partner=lucaberton');
  await expect(creative.locator('source')).toHaveAttribute('srcset', /black-friday-wide/);
  await expect(creative.locator('img')).toHaveAttribute('src', /black-friday-compact/);
  await page.clock.setSystemTime(new Date('2026-11-30T07:59:59Z'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(link).toHaveAttribute('data-tp-offer-id', 'jotform_forms_banner');
  await expect(link).toHaveAttribute('href', 'https://www.jotform.com/?partner=lucaberton');
  await expect(creative.locator('source')).toHaveAttribute('srcset', /forms-wide/);
  await expect(creative.locator('img')).toHaveAttribute('src', /forms-compact/);
});

test('Jotform AI Agents graphic has its own affiliate link', async ({ page }) => {
  test.skip(!hasJotformCreatives, 'Jotform media-kit WebP files not committed yet');
  await page.goto('/blog/n8n-workflow-automation-self-hosted-kubernetes-2026/', { waitUntil: 'domcontentloaded' });
  const creative = page.locator('jotform-creative[data-variant="ai_agents"]');
  await expect(creative).toBeVisible();
  await expect(creative.locator('a')).toHaveAttribute('href', 'https://www.jotform.com/ai/agents/?partner=lucaberton');
  await expect(creative.locator('img')).toHaveAttribute('src', /ai-agents/);
});
