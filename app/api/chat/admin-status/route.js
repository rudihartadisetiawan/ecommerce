// ponytail: endpoint publik — tidak butuh auth, dipakai ChatWidget untuk semua user.
// Mengembalikan apakah ada admin yang sedang aktif di halaman /admin/chat.
import { getAdminOnlineCount } from '@/lib/chat-bus'

export const dynamic = 'force-dynamic'

export async function GET() {
  const count = getAdminOnlineCount()
  return Response.json(
    { online: count > 0, count },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
