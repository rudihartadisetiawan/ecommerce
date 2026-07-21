import { prisma } from './prisma'

// Log aktivitas admin — fire-and-forget, tidak throw error
export async function logAdminAction(session, action, target, detail) {
  if (!session?.user?.id) return
  const role = session.user.role
  if (role !== 'admin' && role !== 'super_admin') return

  try {
    await prisma.adminLog.create({
      data: {
        userId: Number(session.user.id),
        name: session.user.name || 'Admin',
        action,
        target: String(target).slice(0, 255) || '-',
        detail: detail ? String(detail).slice(0, 500) : null,
      },
    })
  } catch {} // fire-and-forget, jangan ganggu response utama
}
