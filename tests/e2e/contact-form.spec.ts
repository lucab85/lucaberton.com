import { test, expect, type Page } from '@playwright/test';

/**
 * /contact/ form (src/components/contactform.astro): an accepted submission is
 * a consulting lead and must fire the contact_form_submit key event (with
 * first-touch attribution, no form content); a rejected submission must keep
 * what the visitor typed and fire nothing. Web3Forms is mocked.
 */

type TrackedEvent = { event: string } & Record<string, unknown>;

async function recordEvents(page: Page): Promise<TrackedEvent[]> {
  const recorded: TrackedEvent[] = [];
  await page.exposeFunction('__recordEvent', (e: TrackedEvent) => { recorded.push(e); });
  await page.addInitScript(() => {
    const layer: any[] = [];
    const nativePush = Array.prototype.push;
    (layer as any).push = function (...args: any[]) {
      for (const a of args) {
        if (a && typeof a === 'object' && !Array.isArray(a) && typeof a.event === 'string') {
          (window as any).__recordEvent(JSON.parse(JSON.stringify(a)));
        }
      }
      return nativePush.apply(this, args);
    };
    (window as any).dataLayer = layer;
  });
  return recorded;
}

async function fillAndSubmit(page: Page) {
  await page.locator('#contact-name').fill('Ada Lovelace');
  await page.locator('#contact-email').fill('ada@example.com');
  await page.locator('#contact-subject').fill('AI platform assessment');
  await page.locator('#contact-message').fill('We would like to review our GPU platform.');
  await page.locator('#contact-form button[type="submit"]').click();
}

test.describe('contact form lead tracking', () => {
  test('accepted submission fires contact_form_submit with attribution and no form content', async ({ page }) => {
    const events = await recordEvents(page);
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Form submitted successfully' }) }),
    );
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await fillAndSubmit(page);

    await expect(page.locator('#result')).toHaveText('Form submitted successfully');
    await expect.poll(() => events.map((e) => e.event)).toContain('contact_form_submit');
    const lead = events.find((e) => e.event === 'contact_form_submit')!;
    expect(lead.form_id).toBe('contact');
    expect(lead.page_path).toBe('/contact/');
    expect(lead.original_landing_page).toBeTruthy();
    // Never send what the visitor typed.
    expect(JSON.stringify(lead)).not.toMatch(/ada@example\.com|Ada Lovelace|GPU platform/);
    await expect(page.locator('#contact-name')).toHaveValue(''); // form reset on success
  });

  test('rejected submission keeps the visitor’s input and fires no lead event', async ({ page }) => {
    const events = await recordEvents(page);
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Invalid access key' }) }),
    );
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await fillAndSubmit(page);

    await expect(page.locator('#result')).toHaveText('Invalid access key');
    await expect(page.locator('#contact-name')).toHaveValue('Ada Lovelace');
    await expect(page.locator('#contact-message')).toHaveValue('We would like to review our GPU platform.');
    expect(events.map((e) => e.event)).not.toContain('contact_form_submit');
  });
});
