// @ts-check
const { test, expect } = require('@playwright/test')

async function loginAsAdmin({ page }) {
  // Use page.request (shares cookies with browser context) to log in via NextAuth API
  const csrfRes = await page.request.get('/api/auth/csrf')
  const { csrfToken } = await csrfRes.json()

  await page.request.post('/api/auth/callback/credentials', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    form: { csrfToken, email: 'admin@gaul.com', password: 'admin123', json: 'true' },
  })

  // Session cookie is now set in the browser context — navigate to admin
  await page.goto('/admin', { waitUntil: 'networkidle', timeout: 15000 })
}

test.describe('Admin CMS Pages', () => {
  test('navigate to admin login and access CMS', async ({ page }) => {
    await loginAsAdmin({ page })
    await expect(page.locator('h1').first()).toContainText('Dashboard')
  })

  test('admin orders page loads', async ({ page }) => {
    await loginAsAdmin({ page })
    await page.goto('/admin/pesanan')
    await page.waitForURL('/admin/pesanan', { timeout: 10000 })
    await expect(page.locator('h1').first()).toContainText(/Pesanan|Order/i)
  })

  test('admin hero page loads', async ({ page }) => {
    await loginAsAdmin({ page })
    await page.goto('/admin/hero')
    await page.waitForURL('/admin/hero', { timeout: 10000 })
    await expect(page.locator('h1').first()).toContainText(/Hero|Banner/i)
  })

  test('admin add product page loads', async ({ page }) => {
    await loginAsAdmin({ page })
    await page.goto('/admin/produk/add')
    await page.waitForURL('/admin/produk/add', { timeout: 10000 })
    await expect(page.locator('h1').first()).toContainText('Tambah Produk')
  })
})
