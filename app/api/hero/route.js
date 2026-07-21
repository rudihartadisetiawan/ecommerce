import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { logAdminAction } from '@/lib/admin-log'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'
  const where = all ? {} : { isActive: true }
  if (all) {
    try { await requireAdmin() } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  }
  const heroes = await prisma.heroSection.findMany({ where, orderBy: { order: 'asc' } })
  return NextResponse.json(heroes)
}

export async function POST(request) {
  let session; try { session = await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const body = await request.json()
  if (!body?.title || !body?.imageUrl) {
    return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  }
  const hero = await prisma.heroSection.create({
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
  // Trigger notifikasi promo jika hero memiliki subtitle/cta (indikasi kampanye)
  try {
    if (hero.subtitle || hero.ctaText) {
      await prisma.notification.create({
        data: {
          type: 'promo',
          title: hero.title,
          message: hero.subtitle || `Cek koleksi terbaru GAUL sekarang!`,
          link: hero.ctaLink?.replace(/^\//, '') || 'produk',
        },
      })
    }
  } catch {}
  await logAdminAction(session, 'create_hero', `Hero: ${hero.title} (#${hero.id})`)
  return NextResponse.json(hero, { status: 201 })
}