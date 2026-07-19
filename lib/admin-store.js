'use client'

import { useState, useEffect, useCallback } from 'react'

const defaultProducts = [
  { id: 1, name: 'Linen Overshirt', slug: 'linen-overshirt', description: 'Overshirt linen ringan untuk layering sehari-hari.', price: 389000, category: 'Atasan', sizes: ['S','M','L','XL'], colors: [{name:'Natural',hex:'#E8DCC8'},{name:'Charcoal',hex:'#1A1A1A'},{name:'Olive',hex:'#7B8A6F'}], images: ['linen-overshirt-1','linen-overshirt-2','linen-overshirt-3'], stock: 25, is_active: true },
  { id: 2, name: 'Relaxed Chino', slug: 'relaxed-chino', description: 'Chino potongan relaxed.', price: 329000, category: 'Bawahan', sizes: ['S','M','L','XL'], colors: [{name:'Khaki',hex:'#C3B091'},{name:'Black',hex:'#1A1A1A'}], images: ['relaxed-chino-1','relaxed-chino-2'], stock: 18, is_active: true },
  { id: 3, name: 'Cotton Tee', slug: 'cotton-tee', description: 'T-shirt katun premium.', price: 189000, category: 'Atasan', sizes: ['S','M','L','XL'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#1A1A1A'},{name:'Clay',hex:'#C4A882'}], images: ['cotton-tee-1','cotton-tee-2','cotton-tee-3'], stock: 40, is_active: true },
  { id: 4, name: 'Denim Jacket', slug: 'denim-jacket', description: 'Jaket denim klasik.', price: 459000, category: 'Outerwear', sizes: ['M','L','XL'], colors: [{name:'Indigo',hex:'#2B4162'},{name:'Stonewash',hex:'#7B8FA1'}], images: ['denim-jacket-1','denim-jacket-2'], stock: 12, is_active: true },
  { id: 5, name: 'Cargo Pants', slug: 'cargo-pants', description: 'Celana cargo modern.', price: 349000, category: 'Bawahan', sizes: ['S','M','L','XL'], colors: [{name:'Khaki',hex:'#C3B091'},{name:'Black',hex:'#1A1A1A'},{name:'Army',hex:'#4A5D42'}], images: ['cargo-pants-1','cargo-pants-2','cargo-pants-3'], stock: 22, is_active: true },
  { id: 6, name: 'Knit Polo', slug: 'knit-polo', description: 'Polo rajut premium.', price: 259000, category: 'Atasan', sizes: ['S','M','L','XL'], colors: [{name:'Navy',hex:'#1A2332'},{name:'White',hex:'#FFFFFF'}], images: ['knit-polo-1','knit-polo-2'], stock: 15, is_active: true },
]

const defaultOrders = [
  { id: 'GAUL-A1B2C3', date: '5 Jul 2026', total: 527000, status: 'completed', items: 3, customer: 'Rara Anindya', payment: 'Transfer BCA' },
  { id: 'GAUL-D4E5F6', date: '28 Jun 2026', total: 349000, status: 'shipped', items: 1, customer: 'Rara Anindya', payment: 'GoPay' },
  { id: 'GAUL-G7H8I9', date: '15 Jun 2026', total: 756000, status: 'processing', items: 2, customer: 'Rara Anindya', payment: 'OVO' },
  { id: 'GAUL-J0K1L2', date: '1 Jun 2026', total: 189000, status: 'cancelled', items: 1, customer: 'Rara Anindya', payment: 'DANA' },
]

const defaultHero = [
  { id: 1, title: 'New Collection', subtitle: 'Daily outfit untuk keseharian kamu', cta_text: 'Lihat Koleksi', cta_link: '/produk', image_url: 'https://picsum.photos/seed/hero-banner/1200/600', is_active: true },
  { id: 2, title: 'Linen Series', subtitle: 'Ringan, adem, style', cta_text: 'Shop Now', cta_link: '/produk', image_url: 'https://picsum.photos/seed/hero-linen/1200/600', is_active: false },
]

export function useAdminStore(key, defaults) {
  const [data, setData] = useState(defaults)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`gaul-admin-${key}`)
    if (stored) setData(JSON.parse(stored))
    setLoaded(true)
  }, [key])

  useEffect(() => {
    if (loaded) localStorage.setItem(`gaul-admin-${key}`, JSON.stringify(data))
  }, [data, key, loaded])

  return [data, setData, loaded]
}

export { defaultProducts, defaultOrders, defaultHero }
