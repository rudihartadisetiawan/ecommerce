import { describe, it, expect } from 'vitest'

describe('serialize.js', () => {
  describe('serializeProduct', () => {
    it('returns null for falsy input', async () => {
      const { serializeProduct } = await import('../lib/serialize.js')
      expect(serializeProduct(null)).toBe(null)
      expect(serializeProduct(undefined)).toBe(null)
    })

    it('serializes a full product correctly', async () => {
      const { serializeProduct } = await import('../lib/serialize.js')
      const input = {
        id: 1,
        name: 'Overshirt Flanel',
        slug: 'overshirt-flanel',
        description: 'Deskripsi produk',
        price: 150000,
        category: 'Atasan',
        sizes: ['M', 'L', 'XL'],
        colors: [{ name: 'Red', hex: '#FF0000' }],
        images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        stock: 10,
        stockPerVariant: null,
        isActive: true,
        isFeatured: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-06-01'),
      }
      const result = serializeProduct(input)
      expect(result.id).toBe(1)
      expect(result.name).toBe('Overshirt Flanel')
      expect(result.slug).toBe('overshirt-flanel')
      expect(result.price).toBe(150000)
      expect(result.category).toBe('Atasan')
      expect(result.sizes).toEqual(['M', 'L', 'XL'])
      expect(result.colors).toEqual([{ name: 'Red', hex: '#FF0000' }])
      expect(result.image).toBe('https://example.com/img1.jpg')
      expect(result.images).toEqual(['https://example.com/img1.jpg', 'https://example.com/img2.jpg'])
      expect(result.stock).toBe(10)
      expect(result.stockPerVariant).toBe(null)
      expect(result.isActive).toBe(true)
      expect(result.isFeatured).toBe(true)
    })

    it('handles missing optional fields with defaults', async () => {
      const { serializeProduct } = await import('../lib/serialize.js')
      const input = {
        id: 2,
        name: 'Test',
        slug: 'test',
        description: '',
        price: 50000,
        category: 'Bawahan',
        isActive: false,
      }
      const result = serializeProduct(input)
      expect(result.images).toEqual([])
      expect(result.image).toBe('')
      expect(result.sizes).toEqual([])
      expect(result.colors).toEqual([])
      expect(result.stock).toBe(0)
      expect(result.stockPerVariant).toBe(null)
      expect(result.isFeatured).toBe(false)
    })

    it('serializeProductAdmin returns null for null input', async () => {
      const { serializeProductAdmin } = await import('../lib/serialize.js')
      expect(serializeProductAdmin(null)).toBe(null)
    })

    it('handles non-array images gracefully', async () => {
      const { serializeProduct } = await import('../lib/serialize.js')
      const input = {
        id: 3,
        name: 'Test',
        slug: 'test',
        description: '',
        price: 50000,
        category: 'Aksesoris',
        images: 'not-an-array', // edge case
        isActive: true,
      }
      const result = serializeProduct(input)
      expect(result.images).toEqual([])
      expect(result.image).toBe('')
    })
  })

  describe('serializeOrder', () => {
    it('returns null for falsy input', async () => {
      const { serializeOrder } = await import('../lib/serialize.js')
      expect(serializeOrder(null)).toBe(null)
    })

    it('serializes a full order correctly', async () => {
      const { serializeOrder } = await import('../lib/serialize.js')
      const now = new Date()
      const input = {
        id: 'GAUL-ABC123',
        status: 'paid',
        total: 200000,
        shippingAddress: 'Jl. Merdeka No.1',
        paymentMethod: 'Transfer BCA',
        paymentRef: 'TRX-001',
        trackingNumber: 'JNE123456',
        receivedProofImage: null,
        createdAt: now,
        items: [
          {
            id: 1,
            productId: 1,
            product: {
              name: 'Overshirt Flanel',
              slug: 'overshirt-flanel',
              images: ['https://example.com/img.jpg'],
            },
            variant: { size: 'L', colorName: 'Red', colorHex: '#FF0000' },
            qty: 2,
            priceAtPurchase: 150000,
          },
        ],
      }
      const result = serializeOrder(input)
      expect(result.id).toBe('GAUL-ABC123')
      expect(result.status).toBe('paid')
      expect(result.total).toBe(200000)
      expect(result.paymentMethod).toBe('Transfer BCA')
      expect(result.paymentRef).toBe('TRX-001')
      expect(result.trackingNumber).toBe('JNE123456')
      expect(result.receivedProofImage).toBe(null)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Overshirt Flanel')
      expect(result.items[0].variant).toEqual({ size: 'L', colorName: 'Red', colorHex: '#FF0000' })
      expect(result.items[0].qty).toBe(2)
    })

    it('handles order with no items', async () => {
      const { serializeOrder } = await import('../lib/serialize.js')
      const input = {
        id: 'GAUL-NO-ITEMS',
        status: 'pending',
        total: 0,
        shippingAddress: 'Addr',
        paymentMethod: 'QRIS',
        createdAt: new Date(),
        items: [],
      }
      const result = serializeOrder(input)
      expect(result.items).toEqual([])
    })

    it('handles missing product in items (deleted product)', async () => {
      const { serializeOrder } = await import('../lib/serialize.js')
      const input = {
        id: 'GAUL-DEL',
        status: 'completed',
        total: 50000,
        shippingAddress: 'Addr',
        paymentMethod: 'GoPay',
        createdAt: new Date(),
        items: [
          {
            id: 1,
            productId: null,
            product: null,
            variant: { size: 'M' },
            qty: 1,
            priceAtPurchase: 50000,
          },
        ],
      }
      const result = serializeOrder(input)
      expect(result.items[0].name).toBe(null)
      expect(result.items[0].image).toBe('')
    })
  })
})
