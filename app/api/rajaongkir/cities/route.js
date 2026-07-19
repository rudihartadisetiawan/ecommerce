import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

export async function GET(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get('province_id')
  if (!provinceId) return NextResponse.json({ error: 'province_id wajib' }, { status: 400 })

  try {
    const res = await fetch(`${BASE_URL}/destination/city/${provinceId}`, {
      headers: { key: process.env.RAJAONGKIR_API_KEY },
      next: { revalidate: 86400 },
    })
    const data = await res.json()
    return NextResponse.json(data.data ?? data)
  } catch (e) {
    return NextResponse.json({ error: 'RAJAONGKIR_ERROR' }, { status: 502 })
  }
}
