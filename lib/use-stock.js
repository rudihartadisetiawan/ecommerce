'use client'

import { useState, useEffect, useCallback } from 'react'

// Ambil stok aktual tiap produk di keranjang langsung dari DB (bukan data cart yg basi).
// Kunci varian mengikuti backend: `${size}-${colorName || color}`.
export function variantKey(size, colorName, color) {
  return `${size || ''}-${colorName || color || ''}`
}

export function availableStock(product, size, colorName, color) {
  if (!product) return null
  const key = variantKey(size, colorName, color)
  const varStock = product.stockPerVariant?.[key]
  if (varStock !== undefined && varStock !== null) return varStock
  return product.stock ?? 0
}

export default function useStockMap(items) {
  const [stockMap, setStockMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const slugs = [...new Set((items || []).map(i => i.slug).filter(Boolean))]
    if (slugs.length === 0) { setStockMap({}); setLoading(false); return undefined }

    setLoading(true)
    Promise.all(slugs.map(slug => fetch(`/api/products/slug/${slug}`).then(r => r.ok ? r.json() : null).catch(() => null)))
      .then(list => {
        if (!active) return
        const map = {}
        for (const p of list) if (p && p.id) map[p.id] = p
        setStockMap(map)
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [items])

  const stockFor = useCallback((item) => {
    const p = stockMap[item.productId || item.product_id]
    if (!p) return null
    return availableStock(p, item.size, item.colorName, item.color)
  }, [stockMap])

  return { stockMap, loading, stockFor }
}