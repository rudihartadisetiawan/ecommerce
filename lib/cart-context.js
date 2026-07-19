'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gaul-cart')
      setItems(stored ? JSON.parse(stored) : [])
    } catch { setItems([]) }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('gaul-cart', JSON.stringify(items))
  }, [items, loaded])

  const addItem = useCallback((product, size, color) => {
    const colorHex = typeof color === 'string' ? color : color?.hex || ''
    const colorName = typeof color === 'string' ? '' : color?.name || ''
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.size === size && i.color === colorHex)
      if (existing) return prev.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: Date.now(), product_id: product.id, productId: product.id, name: product.name, slug: product.slug, image: product.image, price: product.price, size, color: colorHex, colorName, qty: 1 }]
    })
  }, [])

  const removeItem = useCallback((id) => setItems(prev => prev.filter(i => i.id !== id)), [])
  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }, [])
  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
