import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const res = await fetch(`${BASE_URL}/destination/province`, {
      headers: { key: process.env.RAJAONGKIR_API_KEY },
      // Cache 24 jam — daftar provinsi jarang berubah
      next: { revalidate: 86400 },
    })
    const data = await res.json()
    return NextResponse.json(data.data ?? data)
  } catch (e) {
    return NextResponse.json({ error: 'RAJAONGKIR_ERROR' }, { status: 502 })
  }
}
