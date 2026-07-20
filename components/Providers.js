'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/lib/cart-context'
import { ToastProvider } from '@/components/ui/Toast'
import { ChatWidgetWrapper } from '@/components/shop/ChatWidget'

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>
        <ToastProvider>
          {children}
          <ChatWidgetWrapper />
        </ToastProvider>
      </CartProvider>
    </SessionProvider>
  )
}