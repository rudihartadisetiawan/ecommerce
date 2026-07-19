'use client'

import ChatWidget from '@/components/shop/ChatWidget'

export default function ShopLayout({ children }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  )
}
