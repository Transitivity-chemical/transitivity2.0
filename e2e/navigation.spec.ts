import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page nav links work — About scrolls to section', async ({ page }) => {
    await page.goto('/en');
    const aboutLink = page.locator('header nav a[href="#about"]');
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL(/\/en#about/);
  });

  test('landing page nav links work — Features scrolls to section', async ({ page }) => {
    await page.goto('/en');
    const featuresLink = page.locator('header nav a[href="#features"]');
    await expect(featuresLink).toBeVisible();
    await featuresLink.click();
    await expect(page).toHaveURL(/\/en#features/);
  });

  test('landing page nav links work — Pricing scrolls to section', async ({ page }) => {
    await page.goto('/en');
    const pricingLink = page.locator('header nav a[href="#pricing"]');
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/en#pricing/);
  });

  test('Login and Register buttons visible in header', async ({ page }) => {
    await page.goto('/en');
    const header = page.locator('header');
    await expect(header.getByText('Sign In')).toBeVisible();
    await expect(header.getByText('Get Started Free')).toBeVisible();
  });

  test('Sign In button navigates to login page', async ({ page }) => {
    await page.goto('/en');
    const signInLink = page.locator('header a[href="/en/login"]');
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('Get Started button navigates to register page', async ({ page }) => {
    await page.goto('/en');
    const registerLink = page.locator('header a[href="/en/register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/en\/register/);
  });

  test('course link in header navigates to course page', async ({ page }) => {
    await page.goto('/en');
    const courseLink = page.locator('header a[href="/en/course"]');
    await expect(courseLink).toBeVisible();
    await courseLink.click();
    await expect(page).toHaveURL(/\/en\/course/);
  });
});
