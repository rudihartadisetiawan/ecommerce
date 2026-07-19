import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { chatBus } from '@/lib/chat-bus'

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

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
