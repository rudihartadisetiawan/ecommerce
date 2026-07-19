'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import Navigation from '@/components/shop/Navigation'
import CartItem from '@/components/shop/CartItem'
import Container from '@/components/ui/Container'

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal } = useCart()
  const total = subtotal

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20">
          <Container>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="mb-4 h-16 w-16 text-[var(--color-text-secondary)]/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <p className="text-sm text-[var(--color-text-secondary)]">Keranjang masih kosong.</p>
              <Link href="/produk" className="mt-4 text-xs font-medium text-[var(--color-accent)] underline underline-offset-4">Mulai Belanja</Link>
            </div>
          </Container>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <Container>
          <div className="mb-8">
            <p className="text-xs text-[var(--color-text-secondary)]">Beranda / Keranjang</p>
            <h1 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Keranjang</h1>
          </div>

          <div className="lg:flex lg:gap-10">
            <div className="flex-1">
              <AnimatePresence>
                {items.map(item => (
                  <CartItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
              <div className="sticky top-28 rounded-2xl bg-[var(--color-bg-section)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Ringkasan</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Subtotal</span>
                    <span className="text-[var(--color-text-primary)]">Rp{subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Ongkos Kirim</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <div className="border-t border-[var(--color-text-secondary)]/20 pt-3 flex justify-between font-medium text-[var(--color-text-primary)]">
                    <span>Total</span>
                    <span>Rp{total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  )
}
