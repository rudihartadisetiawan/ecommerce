// SSE endpoint — customer stream untuk real-time messages + typing indicator
import { getSession } from '@/lib/session'
import { chatBus } from '@/lib/chat-bus'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const userId = Number(session.user.id)
  const encoder = new TextEncoder()
  let unsubscribe = null
  let heartbeat

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)) } catch {}
      }

      send({ type: 'connected' })

      unsubscribe = chatBus.subscribe((payload) => {
        if (payload.type === 'message' && Number(payload.userId) === userId) {
          send({ type: 'message', data: payload.data })
        } else if (payload.type === 'typing' && Number(payload.conversationUserId) === userId && payload.sender === 'admin') {
          send({ type: 'typing', sender: payload.sender, isTyping: payload.isTyping })
        }
      })

      heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)) } catch {}
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe?.()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      clearInterval(heartbeat)
      unsubscribe?.()
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
