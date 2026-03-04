import { test, expect } from '@playwright/test';

test.describe('Dashboard (unauthenticated)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/dashboard');
    // The dashboard layout checks auth and redirects to /en/login
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10000 });
  });

  test('rate-constant page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/rate-constant');
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10000 });
  });

  test('fitting page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/fitting');
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10000 });
  });

  test('ml page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/ml');
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10000 });
  });

  test('settings page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10000 });
  });
});
