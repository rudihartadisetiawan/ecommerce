// ponytail: public serializer — NO costPrice (rahasia dagang)
export function serializeProduct(p) {
  if (!p) return null
  const images = Array.isArray(p.images) ? p.images : []
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    images,
    image: images[0] ?? '',
    stock: p.stock ?? 0,
    stockPerVariant: p.stockPerVariant ?? null,
    isActive: p.isActive,
    isFeatured: p.isFeatured ?? false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

// Admin serializer — include costPrice, hanya dipanggil di endpoint yang ter-guard admin
export function serializeProductAdmin(p) {
  const base = serializeProduct(p)
  if (!base) return null
  return { ...base, costPrice: p.costPrice ?? 0 }
}

export function serializeOrder(o) {
  if (!o) return null
  return {
    id: o.id,
    status: o.status,
    total: o.total,
    shippingAddress: o.shippingAddress,
    paymentMethod: o.paymentMethod,
    paymentRef: o.paymentRef,
    trackingNumber: o.trackingNumber ?? null,
    receivedProofImage: o.receivedProofImage ?? null,
    createdAt: o.createdAt,
    items: (o.items ?? []).map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product?.name ?? null,
      slug: i.product?.slug ?? null,
      image: Array.isArray(i.product?.images) ? i.product.images[0] : '',
      variant: i.variant,
      qty: i.qty,
      priceAtPurchase: i.priceAtPurchase,
    })),
  }
}