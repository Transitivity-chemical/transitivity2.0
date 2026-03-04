import { test, expect } from '@playwright/test';

test.describe('Course Page', () => {
  test('loads with hero section', async ({ page }) => {
    await page.goto('/en/course');
    const hero = page.locator('h1');
    await expect(hero).toBeVisible();
  });

  test('shows module sections', async ({ page }) => {
    await page.goto('/en/course');
    // The page renders 4 modules with "Module N" badge spans
    const modules = page.locator('#modules section');
    await expect(modules).toHaveCount(4);
    await expect(page.getByText('Module 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Module 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Module 3', { exact: true })).toBeVisible();
    await expect(page.getByText('Module 4', { exact: true })).toBeVisible();
  });

  test('module sections contain notebook links', async ({ page }) => {
    await page.goto('/en/course');
    // Each module has at least one ColabCard linking to Google Colab
    const colabLinks = page.locator('a[href*="colab.research.google.com"]');
    // There are at least 7 notebook links across all modules
    await expect(colabLinks).toHaveCount(7);
  });

  test('has GitHub link in header', async ({ page }) => {
    await page.goto('/en/course');
    const githubLink = page.locator('a[href*="github.com/UnB-CIS"]');
    await expect(githubLink.first()).toBeVisible();
  });

  test('has navigation back to home', async ({ page }) => {
    await page.goto('/en/course');
    const homeLink = page.getByRole('link', { name: 'Home' });
    await expect(homeLink).toBeVisible();
  });

  test('footer contains University of Brasilia reference', async ({ page }) => {
    await page.goto('/en/course');
    const footer = page.locator('footer');
    await expect(footer.getByText('University of Brasilia')).toBeVisible();
  });
});
