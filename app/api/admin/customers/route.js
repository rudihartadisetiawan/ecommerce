import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const customers = await prisma.user.findMany({
    where: { role: 'customer' },
    include: {
      orders: {
        where: { status: 'completed' },
        include: {
          items: {
            include: { product: { select: { category: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = customers.map(u => {
    const completed = u.orders
    const totalSpent = completed.reduce((sum, o) => sum + o.total, 0)
    const orderCount = completed.length

    // Preferred category
    const catCount = {}
    let preferredCategory = '—'
    for (const o of completed) {
      for (const item of o.items) {
        const cat = item.product?.category || 'Lainnya'
        catCount[cat] = (catCount[cat] || 0) + item.qty
      }
    }
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]
    if (topCat) preferredCategory = topCat[0]

    // Preferred size
    const sizeCount = {}
    for (const o of completed) {
      for (const item of o.items) {
        const sizes = item.variant?.size || item.variant?.sizes
        const size = Array.isArray(sizes) ? sizes[0] : sizes
        if (size) sizeCount[size] = (sizeCount[size] || 0) + item.qty
      }
    }
    const topSize = Object.entries(sizeCount).sort((a, b) => b[1] - a[1])[0]
    const preferredSize = topSize ? topSize[0] : '—'

    // City parse from shipping address
    const lastAddr = completed[0]?.shippingAddress || ''
    const city = lastAddr.includes(',')
      ? lastAddr.split(',').map(s => s.trim()).filter(Boolean).reverse()[1] || '—'
      : '—'

    // Preferred payment
    const pmtCount = {}
    for (const o of completed) {
      const pm = o.paymentMethod || 'Lainnya'
      pmtCount[pm] = (pmtCount[pm] || 0) + 1
    }
    const topPmt = Object.entries(pmtCount).sort((a, b) => b[1] - a[1])[0]
    const preferredPayment = topPmt ? topPmt[0] : '—'

    const lastOrder = completed[0]
      ? new Date(completed[0].createdAt).toISOString().split('T')[0]
      : null

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '—',
      createdAt: new Date(u.createdAt).toISOString().split('T')[0],
      orderCount,
      totalSpent,
      lastOrder,
      city,
      preferredCategory,
      preferredSize,
      preferredPayment,
    }
  })

  return NextResponse.json(result)
}
