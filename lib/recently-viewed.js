// ponytail: localStorage-based recently viewed — no API needed
const STORAGE_KEY = 'gaul_recently_viewed'
const MAX_ITEMS = 8

export function getRecentlyViewed() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function addRecentlyViewed(product) {
  if (typeof window === 'undefined') return
  try {
    const list = getRecentlyViewed().filter(p => p.id !== product.id)
    list.unshift({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : product.image,
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)))
  } catch {}
}
