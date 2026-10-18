'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
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

  // pt = tinggi header fixed (h-16 sm:h-20); pb-24/28 agar chat widget (bottom-6, h-14) tak menutupi konten
  return (
    <div className="min-h-screen bg-[var(--color-bg-warm)] pt-16 pb-24 sm:pt-20 sm:pb-28">
      <Container>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke toko
        </Link>
        <div className="lg:flex lg:items-start lg:gap-10">
          <aside className="mb-4 lg:mb-0 lg:w-64 lg:shrink-0">
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
