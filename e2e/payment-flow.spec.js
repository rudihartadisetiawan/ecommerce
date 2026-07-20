// @ts-check
const { test, expect } = require('@playwright/test')

async function registerCustomer(page) {
  const email = `pay_${Date.now()}@test.com`
  await page.goto('/account/register')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="name"]', 'Payment Test')
  await page.fill('input[name="phone"]', '081234567890')
  await page.fill('input[name="password"]', 'PayTest123')
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 })
}

async function addProductToCart(page) {
  await page.goto('/produk/cotton-tee')
  await page.waitForFunction(() => document.querySelector('h1'), { timeout: 10000 })

  await page.locator('div.flex.flex-wrap.gap-2 button').filter({ hasText: 'M' }).click()
  await page.waitForTimeout(200)

  await page.locator('div.flex.flex-wrap.gap-3 button').first().click()
  await page.waitForTimeout(200)

  await page.locator('button:has-text("Tambah ke Keranjang")').click()
  await expect(page.locator('button:has-text("Ditambahkan!")')).toBeVisible({ timeout: 5000 })
}

function mockRajaOngkir(page) {
  page.route('**/api/rajaongkir/provinces', async route => {
    await route.fulfill({ json: [
      { id: '1', name: 'Bali' },
      { id: '2', name: 'Jawa Barat' },
      { id: '3', name: 'DKI Jakarta' },
    ]})
  })
  page.route('**/api/rajaongkir/cities*', async route => {
    await route.fulfill({ json: [
      { id: '101', name: 'Bandung' },
      { id: '102', name: 'Bekasi' },
    ]})
  })
  page.route('**/api/rajaongkir/cost', async route => {
    await route.fulfill({ json: [
      { courier: 'JNE', service: 'REG', description: 'Reguler', cost: 15000, etd: '3-5' },
      { courier: 'JNE', service: 'YES', description: 'Yes', cost: 30000, etd: '1' },
    ]})
  })
}

test.describe('Payment Flow', () => {
  test('add to cart then view cart page', async ({ page }) => {
    await registerCustomer(page)
    await addProductToCart(page)

    await page.locator('a[aria-label="Cart"]').click()
    await page.waitForURL('/cart', { timeout: 5000 })
    await expect(page.locator('h1')).toContainText('Keranjang')
  })

  test('checkout page flow', async ({ page }) => {
    mockRajaOngkir(page)
    await registerCustomer(page)
    await addProductToCart(page)

    await page.goto('/checkout')
    await expect(page.locator('h1')).toContainText('Checkout', { timeout: 10000 })

    await page.fill('input[name="name"]', 'Budi Santoso')
    await page.fill('input[name="phone"]', '081298765432')
    await page.fill('input[name="address"]', 'Jl. Merdeka No. 1')

    await page.locator('select').first().selectOption({ label: 'Jawa Barat' })
    await page.waitForTimeout(500)

    const citySelect = page.locator('select').nth(1)
    await citySelect.selectOption({ label: 'Bandung' })
    await page.waitForFunction(() => {
      return document.querySelectorAll('input[name="shipping"]').length > 0
    }, { timeout: 10000 })

    await page.locator('input[name="shipping"]').first().click()

    await page.locator('button:has-text("Transfer BCA")').click()

    await page.locator('button:has-text("Bayar")').click()
    await expect(page.locator('text=Memproses...')).toBeVisible({ timeout: 5000 })
  })

  test('checkout with empty cart shows empty state', async ({ page }) => {
    await registerCustomer(page)

    await page.goto('/checkout')
    await expect(page.locator('text=Keranjang masih kosong')).toBeVisible({ timeout: 10000 })
  })

  test('guest redirect on checkout', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForURL(/\/account\/login/, { timeout: 10000 })
    expect(page.url()).toContain('callbackUrl')
  })
})
