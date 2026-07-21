import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request) {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawType = searchParams.get('type')
  const isAll = !rawType || rawType === '' || rawType === 'all'
  const type = rawType === 'activity' ? 'admin' : rawType

  let result = []

  if (isAll || type === 'login') {
    const loginLogs = await prisma.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: isAll ? 50 : 100,
    })
    result = [...result, ...loginLogs.map(l => ({ ...l, logType: 'login', createdAt: l.createdAt.toISOString() }))]
  }

  if (isAll || type === 'admin') {
    const adminLogs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: isAll ? 50 : 100,
    })
    result = [...result, ...adminLogs.map(l => ({ ...l, logType: 'activity', createdAt: l.createdAt.toISOString() }))]
  }

  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return NextResponse.json(result.slice(0, 100))
}
