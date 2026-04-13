import { test, expect } from '@playwright/test';

/**
 * Smoke tests for new sub-tab pages (Rate Constant, MD, Fitting).
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phase 9
 *
 * Assumes the test runner is authenticated or these pages redirect to
 * /login. The test then just asserts the redirect happened (which proves
 * the route loads without 500).
 */

test.describe('Chemistry tab pages smoke', () => {
  test('rate-constant page loads', async ({ page }) => {
    const res = await page.goto('/en/rate-constant');
    // either the tabs are visible, or we were redirected to login
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });

  test('md page loads', async ({ page }) => {
    const res = await page.goto('/en/md');
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test('fitting page loads', async ({ page }) => {
    const res = await page.goto('/en/fitting');
    expect(res?.status() ?? 0).toBeLessThan(500);
  });
});
