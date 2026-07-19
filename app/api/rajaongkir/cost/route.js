import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const BASE_URL = 'https://rajaongkir.komerce.id/api/v1'
const DEFAULT_COURIERS = ['jne', 'jnt', 'sicepat']

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await request.json()
    const { destination_city_id, weight = 500 } = body

    if (!destination_city_id) {
      return NextResponse.json({ error: 'destination_city_id wajib' }, { status: 400 })
    }

    const originCityId = process.env.RAJAONGKIR_ORIGIN_CITY_ID
    const couriers = (body.couriers ?? DEFAULT_COURIERS).join(':')

    const formData = new URLSearchParams({
      origin: originCityId,
      destination: String(destination_city_id),
      weight: String(weight),
      courier: couriers,
    })

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: 'POST',
      headers: {
        key: process.env.RAJAONGKIR_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await res.json()

    if (!res.ok || data?.meta?.code !== 200) {
      const msg = data?.meta?.message ?? 'RAJAONGKIR_ERROR'
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    // Response v1 komerce: flat array — setiap item langsung punya { name, code, service, description, cost, etd }
    const results = Array.isArray(data?.data) ? data.data : []
    const options = results.map(item => ({
      courier: (item.code ?? '').toUpperCase(),
      courierName: item.name ?? item.code,
      service: item.service ?? '',
      description: item.description ?? '',
      cost: Number(item.cost) || 0,
      etd: item.etd || '-',
    }))

    return NextResponse.json(options)
  } catch (e) {
    return NextResponse.json({ error: 'RAJAONGKIR_ERROR', message: e.message }, { status: 502 })
  }
}
