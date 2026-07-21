import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { logAdminAction } from '@/lib/admin-log'

export async function PUT(request, { params }) {
  let session; try { session = await requireAdmin() } catch (e) {
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
    await logAdminAction(session, 'update_hero', `Hero: ${hero.title} (#${hero.id})`)
    return NextResponse.json(hero)
  } catch (e) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(request, { params }) {
  let session; try { session = await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const { id } = await params
  try {
    await prisma.heroSection.delete({ where: { id: Number(id) } })
    await logAdminAction(session, 'delete_hero', `Hero ID: ${id}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}