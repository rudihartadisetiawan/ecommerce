// @ts-check
const { test, expect } = require('@playwright/test')

const CUSTOMER_EMAIL = `e2e_auth_${Date.now()}@test.com`
const CUSTOMER_PASSWORD = 'Test123456'

test.describe('Auth Flow', () => {
  test('register a new customer account', async ({ page }) => {
    await page.goto('/account/register')
    await expect(page.locator('h1')).toContainText('Daftar')

    await page.fill('input[name="email"]', CUSTOMER_EMAIL)
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="phone"]', '081234567890')
    await page.fill('input[name="password"]', CUSTOMER_PASSWORD)
    await page.click('button[type="submit"]')

    // Customer registration redirects to homepage (/)
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 })
    await expect(page.locator('nav')).toContainText('GAUL')
  })

  test('login with registered credentials', async ({ page }) => {
    await page.goto('/account/login')
    await expect(page.locator('h1')).toContainText('Masuk')

    await page.fill('input[type="email"]', CUSTOMER_EMAIL)
    await page.fill('input[type="password"]', CUSTOMER_PASSWORD)
    await page.click('button[type="submit"]')

    // Login redirects to homepage for customer
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 })
    await expect(page.locator('nav')).toContainText('GAUL')
  })

  test('wrong credentials shows error message', async ({ page }) => {
    await page.goto('/account/login')

    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Email atau password salah')).toBeVisible({ timeout: 5000 })
  })

  test('admin login can access CMS', async ({ page }) => {
    // First, use the login form to authenticate
    await page.goto('/account/login')
    await expect(page.locator('h1')).toContainText('Masuk')
    await page.fill('input[type="email"]', 'admin@gaul.com')
    await page.fill('input[type="password"]', 'admin123')
    // Click submit and wait for any navigation/client update
    await Promise.all([
      page.waitForResponse(r => r.url().includes('callback/credentials') && r.status() === 200, { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ])
    // Wait a moment for session to be established client-side
    await page.waitForTimeout(2000)

    // Now navigate to admin dashboard — session cookie should be set
    await page.goto('/admin', { waitUntil: 'networkidle' })
    // Check we're on admin page (expect heading)
    await expect(page.locator('h1').first()).toContainText('Dashboard', { timeout: 5000 })
  })
})
