import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function PUT(request, { params }) {
  try { await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const { id } = await params
  const body = await request.json()
  try {
    const hero = await prisma.heroSection.update({
      where: { id: Number(id) },
      data: {
        imageUrl: body.imageUrl,
        title: body.title,
        subtitle: body.subtitle ?? '',
        ctaText: body.ctaText ?? '',
        ctaLink: body.ctaLink ?? '/produk',
        isActive: body.isActive ?? true,
        order: body.order ?? 0,
      },
    })
    return NextResponse.json(hero)
  } catch (e) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(request, { params }) {
  try { await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const { id } = await params
  try {
    await prisma.heroSection.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}