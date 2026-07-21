import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { z } from 'zod'

// GET: ambil semua content block (public — dipakai homepage)
// atau dengan query ?key=... untuk satu block
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (key) {
    const block = await prisma.contentBlock.findUnique({ where: { key } })
    if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(block)
  }

  const blocks = await prisma.contentBlock.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json(blocks)
}

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  data: z.record(z.any()),
})

// PUT: update content block (admin only)
export async function PUT(req) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Query key required' }, { status: 400 })

  let body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updateData = {}
  if (parsed.data.label) updateData.label = parsed.data.label
  if (parsed.data.data) updateData.data = parsed.data.data

  const block = await prisma.contentBlock.update({ where: { key }, data: updateData })
  return NextResponse.json(block)
}
