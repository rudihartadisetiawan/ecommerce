'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className="flex gap-4 border-b border-[var(--color-bg-section)] py-5"
    >
      <Link href={`/produk/${item.slug}`} className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-section)] sm:h-28 sm:w-24">
        <Image src={item.image} alt={item.name} width={200} height={240} className="h-full w-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/produk/${item.slug}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:underline">
            {item.name}
          </Link>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {item.size} {item.colorName ? `· ${item.colorName}` : ''} / <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: item.color }} />
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
            Rp{item.price.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-text-secondary)]/20">
            <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" disabled={item.qty <= 1}>−</button>
            <span className="min-w-[24px] text-center text-sm font-medium">{item.qty}</span>
            <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">+</button>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Rp{(item.price * item.qty).toLocaleString('id-ID')}
            </p>
            <button onClick={() => onRemove(item.id)} className="text-xs text-[var(--color-text-secondary)] hover:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
