import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// ponytail: file upload via base64 — tidak perlu dependency tambahan
export async function POST(request) {
  const body = await request.json()
  const { file } = body
  if (!file || typeof file !== 'string') {
    return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  }

  // Validasi format data URL: data:image/{type};base64,...
  const match = file.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/)
  if (!match) {
    return NextResponse.json({ error: 'Hanya file gambar (PNG, JPEG, WebP, GIF) yang diizinkan' }, { status: 400 })
  }

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, 'base64')

  // Batas 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
  }

  const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads')

  try {
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)
  } catch {
    return NextResponse.json({ error: 'GAGAL_MENYIMPAN' }, { status: 500 })
  }

  return NextResponse.json({ url: `/uploads/${filename}` })
}
