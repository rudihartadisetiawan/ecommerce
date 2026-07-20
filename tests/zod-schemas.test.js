import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// We test the actual Zod schemas used in the API endpoints
// Since they're inline in route files, we replicate them here for testing

describe('Register Schema (app/api/auth/register/route.js)', () => {
  // Schema from register endpoint
  const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  })

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '08123456789',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('accepts registration without phone', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
})

describe('Coupon Schema (app/api/admin/coupons/route.js)', () => {
  // Schema should validate coupon creation
  const couponCreateSchema = z.object({
    code: z.string().min(1).max(50),
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().positive(),
    minPurchase: z.number().nonnegative().optional(),
    maxUses: z.number().int().nonnegative().optional(),
    expiresAt: z.string().optional(),
  })

  it('accepts valid percentage coupon', () => {
    const result = couponCreateSchema.safeParse({
      code: 'DISKON10',
      type: 'percentage',
      value: 10,
      minPurchase: 100000,
      maxUses: 100,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid fixed coupon', () => {
    const result = couponCreateSchema.safeParse({
      code: 'FLAT20K',
      type: 'fixed',
      value: 20000,
    })
    expect(result.success).toBe(true)
  })

  it('accepts coupon with only required fields', () => {
    const result = couponCreateSchema.safeParse({
      code: 'MINIMAL',
      value: 5000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects coupon without code', () => {
    const result = couponCreateSchema.safeParse({
      value: 5000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects coupon with zero value', () => {
    const result = couponCreateSchema.safeParse({
      code: 'FREE',
      value: 0,
    })
    expect(result.success).toBe(false) // value must be positive
  })

  it('rejects invalid type', () => {
    const result = couponCreateSchema.safeParse({
      code: 'INVALID',
      type: 'invalid_type',
      value: 5000,
    })
    expect(result.success).toBe(false)
  })
})

describe('Order Item Schema (app/api/orders/route.js)', () => {
  // Schema should validate order items
  const itemSchema = z.object({
    productId: z.number().int().positive(),
    variant: z.object({
      size: z.string(),
      colorName: z.string(),
    }).passthrough(),
    qty: z.number().int().min(1).max(20),
  })

  const orderSchema = z.object({
    items: z.array(itemSchema).min(1),
    shippingAddress: z.string().min(5).max(500),
    paymentMethod: z.string().min(1).max(50),
    shippingCost: z.number().nonnegative().max(500000).optional(),
    shippingCourier: z.string().max(50).optional(),
    couponCode: z.string().max(50).optional(),
  })

  it('accepts valid order', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red', colorHex: '#FF0000' },
        qty: 2,
      }],
      shippingAddress: 'Jl. Merdeka No. 123, Bandung',
      paymentMethod: 'Transfer BCA',
      shippingCost: 15000,
      shippingCourier: 'JNE',
    })
    expect(result.success).toBe(true)
  })

  it('accepts order with optional fields omitted', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'M', colorName: 'Blue' },
        qty: 1,
      }],
      shippingAddress: 'Jl. Sudirman No. 45, Jakarta',
      paymentMethod: 'QRIS',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items', () => {
    const result = orderSchema.safeParse({
      items: [],
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('rejects items without items array', () => {
    const result = orderSchema.safeParse({
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('rejects qty exceeding max', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red' },
        qty: 21,
      }],
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('rejects qty less than 1', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red' },
        qty: 0,
      }],
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('rejects fractional qty', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red' },
        qty: 1.5,
      }],
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive productId', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 0,
        variant: { size: 'L', colorName: 'Red' },
        qty: 1,
      }],
      shippingAddress: 'Jl. Merdeka',
      paymentMethod: 'GoPay',
    })
    expect(result.success).toBe(false)
  })

  it('accepts coupon code', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red' },
        qty: 1,
      }],
      shippingAddress: 'Jl. Merdeka No. 123',
      paymentMethod: 'GoPay',
      couponCode: 'DISKON10',
    })
    expect(result.success).toBe(true)
  })

  it('rejects shipping cost exceeding limit', () => {
    const result = orderSchema.safeParse({
      items: [{
        productId: 1,
        variant: { size: 'L', colorName: 'Red' },
        qty: 1,
      }],
      shippingAddress: 'Jl. Merdeka No. 123',
      paymentMethod: 'GoPay',
      shippingCost: 999999,
    })
    expect(result.success).toBe(false)
  })
})

describe('Reset Password Schema (app/api/auth/reset-password/route.js)', () => {
  const resetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6),
  })

  it('accepts valid reset request', () => {
    const result = resetSchema.safeParse({
      token: 'abc123token',
      password: 'newpassword123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short password', () => {
    const result = resetSchema.safeParse({
      token: 'abc123token',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty token', () => {
    const result = resetSchema.safeParse({
      token: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

describe('Review Schema (app/api/reviews/route.js)', () => {
  // Approximate schema — max 2000 char comment, rating 1-5
  const reviewSchema = z.object({
    productId: z.number().int().positive(),
    orderId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000),
  })

  it('accepts valid review', () => {
    const result = reviewSchema.safeParse({
      productId: 1,
      orderId: 'GAUL-123',
      rating: 5,
      comment: 'Produk bagus banget!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects rating below 1', () => {
    const result = reviewSchema.safeParse({
      productId: 1,
      rating: 0,
      comment: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('rejects rating above 5', () => {
    const result = reviewSchema.safeParse({
      productId: 1,
      rating: 6,
      comment: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('rejects comment exceeding 2000 chars', () => {
    const result = reviewSchema.safeParse({
      productId: 1,
      rating: 3,
      comment: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts comment at 2000 char boundary', () => {
    const result = reviewSchema.safeParse({
      productId: 1,
      rating: 3,
      comment: 'x'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })
})

describe('Chat Message Schema (app/api/chat/route.js)', () => {
  // Max 4000 char message
  const chatSchema = z.object({
    message: z.string().max(4000).min(1),
    messageType: z.enum(['text', 'product']).optional(),
    metadata: z.object({
      productId: z.number().int().positive().optional(),
    }).optional(),
  })

  it('accepts valid text message', () => {
    const result = chatSchema.safeParse({
      message: 'Halo, ada yang bisa dibantu?',
    })
    expect(result.success).toBe(true)
  })

  it('accepts product card message', () => {
    const result = chatSchema.safeParse({
      message: 'Lihat produk ini',
      messageType: 'product',
      metadata: { productId: 1 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty message', () => {
    const result = chatSchema.safeParse({
      message: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects message exceeding 4000 chars', () => {
    const result = chatSchema.safeParse({
      message: 'x'.repeat(4001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid messageType', () => {
    const result = chatSchema.safeParse({
      message: 'test',
      messageType: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})
