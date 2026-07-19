// @ts-check
const { test, expect } = require('@playwright/test')

test.describe('Admin CMS Pages', () => {
  test('navigate to admin login and access CMS', async ({ page }) => {
    // Login as admin
    await page.goto('/account/login')
    await page.fill('input[type="email"]', 'admin@gaul.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 })

    // Dashboard has products table
    await expect(page.locator('h1').first()).toContainText('Kelola Produk')
    await expect(page.locator('text=GAUL CMS')).toBeVisible()
  })

  test('admin orders page loads', async ({ page }) => {
    await page.goto('/account/login')
    await page.fill('input[type="email"]', 'admin@gaul.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 })

    await page.goto('/admin/pesanan')
    await page.waitForURL('/admin/pesanan', { timeout: 5000 })
    await expect(page.locator('h1').first()).toContainText(/Pesanan|Order/i)
  })

  test('admin hero page loads', async ({ page }) => {
    await page.goto('/account/login')
    await page.fill('input[type="email"]', 'admin@gaul.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 })

    await page.goto('/admin/hero')
    await page.waitForURL('/admin/hero', { timeout: 5000 })
    await expect(page.locator('h1').first()).toContainText(/Hero|Banner/i)
  })

  test('admin add product page loads', async ({ page }) => {
    await page.goto('/account/login')
    await page.fill('input[type="email"]', 'admin@gaul.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 })

    await page.goto('/admin/produk/add')
    await page.waitForURL('/admin/produk/add', { timeout: 5000 })
    await expect(page.locator('h1').first()).toContainText('Tambah Produk')
  })
})
