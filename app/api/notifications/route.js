import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

// GET /api/notifications — ambil notifikasi (global broadcast: new_collection, promo)
// Semua user melihat notifikasi yang sama — ini adalah broadcast system, bukan per-user.
export async function GET() {
  const session = await getSession()
  const userId = session?.user?.id ? Number(session.user.id) : null

  if (!rateLimit(`notif:${userId ?? 'anon'}`, 30, 60000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { sentAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(notifications)
}

// POST /api/notifications — admin create notification
export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json()
  const { type, title, message, link } = body

  if (!type || !title || !message) {
    return NextResponse.json({ error: 'type, title, message wajib' }, { status: 400 })
  }
  if (!['new_collection', 'promo'].includes(type)) {
    return NextResponse.json({ error: 'type harus new_collection atau promo' }, { status: 400 })
  }
  if (title.length > 200) return NextResponse.json({ error: 'title max 200 char' }, { status: 400 })
  if (message.length > 2000) return NextResponse.json({ error: 'message max 2000 char' }, { status: 400 })
  if (link && link.length > 200) return NextResponse.json({ error: 'link max 200 char' }, { status: 400 })

  const notif = await prisma.notification.create({
    data: { type, title, message, link: link || undefined },
  })

  return NextResponse.json(notif, { status: 201 })
}
