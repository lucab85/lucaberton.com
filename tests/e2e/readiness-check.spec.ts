import { test, expect, type Page } from '@playwright/test';

/**
 * Production AI Readiness Check (src/components/react/ProductionReadinessCheck.tsx)
 * on /production-ai-assessment/: free score/tier, email-gated report,
 * assessment_submit fires only on a successful Web3Forms submission.
 */

const PAGE = '/production-ai-assessment/';

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

async function answerAll(page: Page, values: number[]) {
  const labelFor = (v: number) => (v === 0 ? 'Not yet' : v === 5 ? 'Partially' : 'Fully');
  const check = page.locator('.readiness-check');
  for (let i = 0; i < values.length; i++) {
    const button = check.getByRole('button', { name: labelFor(values[i]), exact: true });
    const current = `Question ${i + 1} of ${values.length}`;
    const next = i + 1 < values.length ? `Question ${i + 2} of ${values.length}` : 'Last step';
    await button.click();
    try {
      // Confirm the click actually advanced state before issuing the next
      // one: every question shares the same three labels, so a click that
      // lands before this client:load island finishes hydrating (or before
      // React commits the previous transition) would otherwise silently hit
      // the outgoing question instead of the intended one.
      await expect(check.getByText(next)).toBeVisible({ timeout: 2000 });
    } catch {
      // Only re-click if we can confirm we're genuinely still on the
      // original question (not just a slow paint) — re-clicking blind risks
      // double-answering the next question once labels repeat.
      await expect(check.getByText(current)).toBeVisible({ timeout: 500 });
      await button.click();
      await expect(check.getByText(next)).toBeVisible();
    }
  }
}

test.describe('Production AI Readiness Check', () => {
  test('completing all 8 questions shows the free score and tier, gated by email', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    const check = page.locator('.readiness-check');
    await expect(check.getByText('Question 1 of 8')).toBeVisible();

    // All "Not yet" -> score 0 -> Prototype stage.
    await answerAll(page, Array(8).fill(0));

    await expect(check.getByTestId('readiness-score')).toHaveText('0');
    await expect(check.getByText('Prototype stage')).toBeVisible();
    await expect(check.locator('input[type="email"]')).toBeVisible();
    // Gap map and CTA are not shown yet — behind the email gate.
    await expect(check.getByText('Start here')).toHaveCount(0);
  });

  test('rejects an invalid email before submitting, does not fire assessment_submit', async ({ page }) => {
    const events = await recordEvents(page);
    let submitCalled = false;
    await page.route('https://api.web3forms.com/submit', (route) => { submitCalled = true; return route.continue(); });
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await answerAll(page, Array(8).fill(0));

    await page.locator('.readiness-check input[type="email"]').fill('not-an-email');
    await page.locator('.readiness-check button[type="submit"]').click();

    await expect(page.getByText('Enter a valid email to see your report.')).toBeVisible();
    expect(submitCalled).toBe(false);
    expect(events.map((e) => e.event)).not.toContain('assessment_submit');
  });

  test('accepted submission reveals the gap map, fires assessment_submit, and the report CTA is tracked', async ({ page }) => {
    const events = await recordEvents(page);
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
    );
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    // Mix of scores: architecture/compute/reliability low (0), the rest high (10).
    await answerAll(page, [0, 0, 0, 10, 10, 10, 10, 10]);

    await page.locator('.readiness-check input[type="email"]').fill('leader@example.com');
    await page.locator('.readiness-check button[type="submit"]').click();

    const check = page.locator('.readiness-check');
    await expect(check.getByText('Start here')).toBeVisible();
    // The three 0-scored areas are the ones surfaced as priorities.
    await expect(check.getByText(/Map the request path end to end/)).toBeVisible();
    await expect(check.getByText(/Instrument GPU utilization/)).toBeVisible();
    await expect(check.getByText(/Define SLOs/)).toBeVisible();

    await expect.poll(() => events.map((e) => e.event)).toContain('assessment_submit');
    const lead = events.find((e) => e.event === 'assessment_submit')!;
    expect(lead.target_offer).toBe('production_ai_assessment');
    // No PII in the event payload.
    expect(JSON.stringify(lead)).not.toMatch(/leader@example\.com/);

    const cta = check.locator('a[data-track-event="consulting_cta_click"][data-tp-cta-variant="readiness_check_report_book_call"]');
    await expect(cta).toHaveAttribute('data-tp-target-offer', 'production_ai_assessment');
    await expect(cta).toHaveAttribute('href', /calendly\.com\/lucaberton/);
  });

  test('a rejected submission keeps the user on the email step with a retry and a real escape hatch, and fires no event', async ({ page }) => {
    const events = await recordEvents(page);
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false }) }),
    );
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await answerAll(page, Array(8).fill(10));

    const check = page.locator('.readiness-check');
    await check.locator('input[type="email"]').fill('leader@example.com');
    await check.locator('button[type="submit"]').click();

    // Stays on the email step — does NOT silently advance to the report
    // (the tier title is already shown here as the free teaser, so "Start
    // here" — the gated gap-map section, report-step only — is the marker).
    await expect(check.getByText('Something went wrong')).toBeVisible();
    await expect(check.getByText('Start here')).toHaveCount(0);
    expect(events.map((e) => e.event)).not.toContain('assessment_submit');

    // The fallback link is a real, tracked Calendly link, not dead text.
    const fallbackCall = check.locator('a[data-track-event="consulting_cta_click"][data-tp-cta-variant="readiness_check_email_error_fallback"]');
    await expect(fallbackCall).toHaveAttribute('href', /calendly\.com\/lucaberton/);

    // The escape hatch reveals the report without ever having succeeded.
    await check.getByRole('button', { name: 'Continue without confirmation →' }).click();
    await expect(check.getByText('Start here')).toBeVisible();
    expect(events.map((e) => e.event)).not.toContain('assessment_submit');
  });

  test('email step has a Back control that returns to the last question with the prior answer highlighted', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    const check = page.locator('.readiness-check');
    await answerAll(page, [0, 5, 10, 0, 5, 10, 0, 10]);
    await expect(check.locator('input[type="email"]')).toBeVisible();

    await check.getByRole('button', { name: '← Back' }).click();
    await expect(check.getByText('Question 8 of 8')).toBeVisible();
    await expect(check.getByRole('button', { name: 'Fully', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(check.getByRole('button', { name: 'Not yet', exact: true })).toHaveAttribute('aria-pressed', 'false');
  });

  test('progress reaches 100% right before the email gate', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await answerAll(page, Array(8).fill(5));
    await expect(page.locator('.readiness-check').getByText('100%')).toBeVisible();
  });

  test('retaking the check resets answers and returns to question 1', async ({ page }) => {
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
    );
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await answerAll(page, Array(8).fill(10));
    await page.locator('.readiness-check input[type="email"]').fill('leader@example.com');
    await page.locator('.readiness-check button[type="submit"]').click();

    await page.getByRole('button', { name: 'Retake the check' }).click();
    await expect(page.locator('.readiness-check').getByText('Question 1 of 8')).toBeVisible();
  });
});
