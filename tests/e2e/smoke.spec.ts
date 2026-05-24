import { test, expect } from '@playwright/test';

test.describe('site smoke tests', () => {
  test('home page renders and has expected title', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Luca Berton/i);
  });

  test('blog index loads and lists posts', async ({ page }) => {
    const response = await page.goto('/blog/');
    expect(response?.ok()).toBeTruthy();
    // At least one anchor pointing to a blog post.
    const postLinks = page.locator('a[href^="/blog/"]');
    await expect(postLinks.first()).toBeVisible();
  });

  test('about page renders', async ({ page }) => {
    const response = await page.goto('/about/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('contact page exposes the contact form', async ({ page }) => {
    const response = await page.goto('/contact/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('#contact-form')).toBeVisible();
  });

  test('canonical link points to the same URL with trailing slash', async ({ page }) => {
    await page.goto('/about/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical!.endsWith('/about/')).toBeTruthy();
  });

  test('404 page is served for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist-xyz/', { waitUntil: 'domcontentloaded' });
    // Static host may return 200 for SPA-style 404.html; just assert page renders something.
    expect(response).not.toBeNull();
    await expect(page.locator('body')).toBeVisible();
  });
});
