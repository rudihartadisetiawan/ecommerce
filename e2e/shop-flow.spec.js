// @ts-check
const { test, expect } = require('@playwright/test')

test.describe('Shop Flow', () => {
  test('homepage loads products', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toContainText('GAUL')

    // Products should load from API
    await page.waitForFunction(() => {
      return document.querySelectorAll('a[href*="/produk/"]').length >= 4
    }, { timeout: 10000 })
  })

  test('product catalog page works', async ({ page }) => {
    await page.goto('/produk')
    await page.waitForFunction(() => {
      return document.querySelectorAll('a[href*="/produk/"]').length >= 4
    }, { timeout: 10000 })
  })

  test('product detail page shows product info', async ({ page }) => {
    await page.goto('/produk/linen-overshirt')
    await page.waitForFunction(() => {
      return document.querySelector('h1')?.textContent?.includes('Linen Overshirt')
    }, { timeout: 10000 })
  })

  test('guest add-to-cart redirects to login after selecting variant', async ({ page }) => {
    await page.goto('/produk/cotton-tee')
    await page.waitForFunction(() => document.querySelector('h1'), { timeout: 10000 })

    // Select size M from the Ukuran section (div.mt-8 > div.flex.flex-wrap.gap-2 > buttons)
    await page.locator('div.flex.flex-wrap.gap-2 button').filter({ hasText: 'M' }).click()
    await page.waitForTimeout(200)

    // Select first color swatch from the Warna section
    await page.locator('div.flex.flex-wrap.gap-3 button').first().click()
    await page.waitForTimeout(200)

    // Now button should be enabled and clicking it redirects to login
    const addBtn = page.locator('button:has-text("Tambah ke Keranjang")')
    await expect(addBtn).toBeEnabled({ timeout: 3000 })
    await addBtn.click()

    // Guest gets redirected to login with callbackUrl
    await page.waitForURL(/\/account\/login/, { timeout: 5000 })
    expect(page.url()).toContain('callbackUrl')
  })

  test('guest cart page shows empty state', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.locator('text=Keranjang masih kosong')).toBeVisible({ timeout: 5000 })
  })

  test('registered user can add item to cart and view it', async ({ page }) => {
    // Register fresh user
    const email = `shop_${Date.now()}@test.com`
    await page.goto('/account/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="name"]', 'Shop Test')
    await page.fill('input[name="phone"]', '081234567890')
    await page.fill('input[name="password"]', 'ShopTest123')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 })

    // Go to product detail
    await page.goto('/produk/cotton-tee')
    await page.waitForFunction(() => document.querySelector('h1'), { timeout: 10000 })

    // Select size M from the Ukuran section
    await page.locator('div.flex.flex-wrap.gap-2 button').filter({ hasText: 'M' }).click()
    await page.waitForTimeout(200)

    // Select first color swatch from the Warna section
    await page.locator('div.flex.flex-wrap.gap-3 button').first().click()
    await page.waitForTimeout(200)

    // Add to cart (button should now be enabled)
    await page.locator('button:has-text("Tambah ke Keranjang")').click()

    // Success feedback: button text changes to "Ditambahkan!"
    await expect(page.locator('button:has-text("Ditambahkan!")')).toBeVisible({ timeout: 5000 })

    // Go to cart
    await page.goto('/cart')
    await page.waitForURL('/cart', { timeout: 5000 })
    await expect(page.locator('h1')).toContainText('Keranjang')
  })
})
