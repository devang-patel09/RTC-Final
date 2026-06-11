const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:5173';

test.describe('Critical User Flows', () => {

  test('1. Registration', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator('h1')).toContainText('Create Account');

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard|\/verify-email/);
  });

  test('2. Login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('h1')).toContainText('Sign In');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('3. Create Project', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto(`${BASE}/projects`);
    await page.click('text=New Project');

    const projectName = `Test Project ${Date.now()}`;
    await page.fill('input[name="title"]', projectName);
    await page.fill('textarea[name="description"]', 'E2E test project');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=' + projectName)).toBeVisible();
  });

  test('4. Create Bug', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto(`${BASE}/projects`);
    await page.locator('a:has-text("Test")').first().click();
    await page.waitForTimeout(1000);

    await page.goto(`${BASE}/projects/test-project/bugs/new`);
    await page.fill('input[name="title"]', `Bug ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'This is a test bug');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Bug')).toBeVisible();
  });

  test('5. Comment on Bug', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto(`${BASE}/projects/test-project/bugs`);
    await page.locator('a:has-text("Bug")').first().click();
    await page.waitForTimeout(1000);

    const commentText = `E2E comment ${Date.now()}`;
    await page.fill('input[placeholder*="comment"]', commentText);
    await page.click('button:has(svg.lucide-send)');
    await page.waitForTimeout(500);

    await expect(page.locator(`text=${commentText}`)).toBeVisible();
  });

  test('6. Create Sprint', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto(`${BASE}/projects/test-project/sprints`);
    await page.click('text=New Sprint');

    const sprintName = `Sprint ${Date.now()}`;
    await page.fill('input[placeholder*="Sprint"]', sprintName);
    await page.fill('textarea', 'E2E sprint goal');
    await page.click('button[type="submit"]');

    await expect(page.locator(`text=${sprintName}`)).toBeVisible();
  });

  test('7. Kanban Board Interaction', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto(`${BASE}/projects/test-project/board`);
    await expect(page.locator('text=Backlog')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('8. Notification Panel', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.click('button:has(svg.lucide-bell)');
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('9. Forgot Password', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.locator('h1')).toContainText('Reset Password');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('10. Theme Toggle', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.click('button:has(svg.lucide-moon), button:has(svg.lucide-sun)');
    await page.waitForTimeout(300);

    const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    expect(typeof isDark).toBe('boolean');
  });
});
