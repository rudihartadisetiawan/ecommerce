import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { chatBus } from '@/lib/chat-bus'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // S-12: Rate limit typing — max 30 event per 10 detik
  if (!rateLimit(`typing:${session.user.id}`, 30, 10000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await request.json()
  const { conversationUserId, isTyping } = body
  if (!conversationUserId) return NextResponse.json({ error: 'INVALID' }, { status: 400 })

  const sender = session.user.role === 'admin' || session.user.role === 'super_admin' ? 'admin' : 'customer'

  chatBus.publish({
    type: 'typing',
    conversationUserId: Number(conversationUserId),
    sender,
    isTyping: !!isTyping,
  })

  return NextResponse.json({ ok: true })
}
