'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductCard({ product }) {
  const [activeColor, setActiveColor] = useState(null)
  const images = product.images || []
  const primaryImage = product.image || images[0] || ''
  const secondaryImage = images[1] || primaryImage

  // Display price formatting
  const formattedPrice = typeof product.price === 'number'
    ? 'Rp' + product.price.toLocaleString('id-ID')
    : ''

  const colors = product.colors || []

  return (
    <div className="group relative flex flex-col">
      {/* Thumbnail Container */}
      <Link
        href={`/produk/${product.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#EBE7DF] transition-transform duration-500 ease-out"
      >
        {/* Primary Image */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          />
        )}

        {/* Secondary Image on Hover */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
        )}

        {/* Utilitarian Badge: Category & Stock */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="rounded border border-black/10 bg-white/95 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-primary)] shadow-xs">
            {product.category || 'ORIGINAL'}
          </span>
          {product.featured && (
            <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white">
              DROP
            </span>
          )}
        </div>

        {/* Out of Stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="rounded bg-black px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white shadow-md">
              SOLD OUT
            </span>
          </div>
        )}
      </Link>

      {/* Meta Information */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/produk/${product.slug}`} className="block">
            <h3 className="line-clamp-1 text-sm font-medium text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <p className="font-mono text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              {formattedPrice}
            </p>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-[10px] font-mono text-amber-700">
                Sisa {product.stock} pcs
              </span>
            )}
          </div>
        </div>

        {/* Interactive Swatch Dots with Active Label */}
        {colors.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {colors.slice(0, 5).map((color, index) => {
                const hex = typeof color === 'string' ? color : color?.hex
                const name = typeof color === 'string' ? color : color?.name
                const isSelected = activeColor === name

                return (
                  <button
                    key={hex ? `${hex}-${index}` : `c-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveColor(isSelected ? null : name)
                    }}
                    onMouseEnter={() => setActiveColor(name)}
                    onMouseLeave={() => setActiveColor(null)}
                    aria-label={name || `Color ${index + 1}`}
                    className={`relative h-3.5 w-3.5 rounded-full transition-transform focus:outline-hidden ${
                      isSelected
                        ? 'scale-125 ring-2 ring-[var(--color-text-primary)] ring-offset-1'
                        : 'hover:scale-110 ring-1 ring-black/15'
                    }`}
                    style={{ backgroundColor: hex || '#CCCCCC' }}
                  />
                )
              })}
            </div>
            {activeColor && (
              <span className="truncate text-[10px] font-mono uppercase text-[var(--color-text-secondary)]">
                {activeColor}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
