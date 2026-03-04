import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('page loads and shows "Transitivity" text', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('body')).toContainText('Transitivity');
  });

  test('navigation links exist (About, Features, Pricing)', async ({ page }) => {
    await page.goto('/en');
    const nav = page.locator('header nav');
    await expect(nav.getByText('About')).toBeVisible();
    await expect(nav.getByText('Features')).toBeVisible();
    await expect(nav.getByText('Pricing')).toBeVisible();
  });

  test('hero section is visible with heading', async ({ page }) => {
    await page.goto('/en');
    const hero = page.locator('h1');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Computational chemistry simplified');
  });

  test('language can be detected from URL', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en/);
  });

  test('features section contains Rate Constants, GSA Fitting, and ML Potentials', async ({ page }) => {
    await page.goto('/en');
    const features = page.locator('#features');
    await expect(features.getByText('Rate Constants', { exact: true })).toBeVisible();
    await expect(features.getByText('GSA Fitting', { exact: true })).toBeVisible();
    await expect(features.getByText('ML Potentials', { exact: true })).toBeVisible();
  });

  test('pricing section shows Free, Pro, and Enterprise plans', async ({ page }) => {
    await page.goto('/en');
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(pricingSection.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(pricingSection.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
  });

  test('footer contains contact info and copyright', async ({ page }) => {
    await page.goto('/en');
    const footer = page.locator('footer');
    await expect(footer.getByText('transitivity@unb.br')).toBeVisible();
    await expect(footer.getByText('Transitivity 2.0', { exact: true }).first()).toBeVisible();
  });
});
