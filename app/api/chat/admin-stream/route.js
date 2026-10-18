import { chatBus, incrementAdminOnline, decrementAdminOnline } from '@/lib/chat-bus'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
  if (!isAdmin) {
    return new Response('Forbidden', { status: 403 })
  }

  const encoder = new TextEncoder()
  let unsubscribe = null
  let heartbeat

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {}
      }

      send({ type: 'connected' })
      incrementAdminOnline()

      unsubscribe = chatBus.subscribe((payload) => {
        if (payload?.type === 'message') {
          send({ type: 'newMessage', data: payload.data, userId: payload.userId })
        } else if (payload?.type === 'typing') {
          send({
            type: 'typing',
            conversationUserId: payload.conversationUserId,
            sender: payload.sender,
            isTyping: payload.isTyping,
          })
        } else if (payload?.type === 'conversation') {
          send({ type: 'newConversation', data: payload.data })
        }
      })

      heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)) } catch {}
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe?.()
        decrementAdminOnline()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      clearInterval(heartbeat)
      unsubscribe?.()
      decrementAdminOnline()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
