'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AccountNav from '@/components/shop/AccountNav'
import Container from '@/components/ui/Container'

const publicPaths = ['/account/login', '/account/register']

export default function AccountLayout({ children }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const isPublic = publicPaths.includes(pathname)
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) router.push('/admin')
    else if (!isPublic && status === 'unauthenticated') router.push('/account/login')
  }, [isPublic, status, isAdmin, router])

  if (!isPublic && status !== 'authenticated') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-secondary)]">Memuat...</div>
  }

  if (isPublic) return <div className="min-h-screen bg-[var(--color-bg-warm)]">{children}</div>

  return (
    <div className="min-h-screen bg-[var(--color-bg-warm)] pt-24 pb-20">
      <Container>
        <div className="lg:flex lg:gap-10">
          <aside className="mb-8 lg:mb-0 lg:w-56 lg:shrink-0">
            <div className="lg:sticky lg:top-28">
              <AccountNav />
            </div>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </div>
  )
}
