import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('login page loads at /en/login', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('shows sign-in button', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Sign In');
  });

  test('register link exists', async ({ page }) => {
    await page.goto('/en/login');
    const registerLink = page.getByRole('link', { name: 'Register' });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/en/register');
  });
});

test.describe('Register Page', () => {
  test('register page loads at /en/register', async ({ page }) => {
    await page.goto('/en/register');
    await expect(page).toHaveURL(/\/en\/register/);
    await expect(page.locator('h2')).toContainText('Create Account');
  });

  test('shows fullName, email, and password fields', async ({ page }) => {
    await page.goto('/en/register');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('shows submit button', async ({ page }) => {
    await page.goto('/en/register');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('has link to login page', async ({ page }) => {
    await page.goto('/en/register');
    const loginLink = page.getByRole('link', { name: 'Sign In' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/en/login');
  });
});
