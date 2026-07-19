'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/lib/cart-context'

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  )
}