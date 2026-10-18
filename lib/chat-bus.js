// ponytail: in-memory pub/sub across Next.js route handlers in same Node process.
// globalThis singleton avoids double-registration during dev hot-reload.
const g = globalThis

function createBus() {
  const subs = new Set()
  return {
    subscribe(cb) {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    publish(payload) {
      for (const cb of subs) {
        try { cb(payload) } catch {}
      }
    },
    size() { return subs.size },
  }
}

g.__chatBus ??= createBus()
g.__typingBus ??= createBus()

export const chatBus = g.__chatBus
export const typingBus = g.__typingBus

// ponytail: volatile per-conversation typing snapshot so reconnects see current state.
// key = `conversationUserId:role` (e.g. "42:admin"), value = { isTyping, since }.
g.__typingState ??= new Map()
export const typingState = g.__typingState

// ponytail: counter admin yang sedang aktif terhubung ke /api/chat/admin-stream.
// Increment saat SSE connect, decrement saat SSE disconnect/abort.
g.__adminOnlineCount ??= 0
export const getAdminOnlineCount = () => g.__adminOnlineCount
export const incrementAdminOnline = () => { g.__adminOnlineCount++ }
export const decrementAdminOnline = () => { if (g.__adminOnlineCount > 0) g.__adminOnlineCount-- }
