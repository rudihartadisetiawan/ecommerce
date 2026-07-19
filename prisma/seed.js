import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Curated Unsplash fashion photos per product
const products = [
  {
    name: 'Linen Overshirt',
    slug: 'linen-overshirt',
    description: 'Overshirt linen ringan untuk layering sehari-hari.',
    price: 389000,
    category: 'Atasan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Natural', hex: '#E8DCC8' }, { name: 'Charcoal', hex: '#1A1A1A' }, { name: 'Olive', hex: '#7B8A6F' }],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1598032895455-1e992e4bc06c?w=800&h=1000&fit=crop',
    ],
    stock: 25,
  },
  {
    name: 'Relaxed Chino',
    slug: 'relaxed-chino',
    description: 'Chino potongan relaxed untuk siluet santai.',
    price: 329000,
    category: 'Bawahan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Khaki', hex: '#C3B091' }, { name: 'Black', hex: '#1A1A1A' }],
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1000&fit=crop',
    ],
    stock: 18,
  },
  {
    name: 'Cotton Tee',
    slug: 'cotton-tee',
    description: 'T-shirt katun premium, soft touch.',
    price: 189000,
    category: 'Atasan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#1A1A1A' }, { name: 'Clay', hex: '#C4A882' }],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop',
    ],
    stock: 40,
  },
  {
    name: 'Denim Jacket',
    slug: 'denim-jacket',
    description: 'Jaket denim klasik, cocok untuk lapisan luar.',
    price: 459000,
    category: 'Outerwear',
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Indigo', hex: '#2B4162' }, { name: 'Stonewash', hex: '#7B8FA1' }],
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&h=1000&fit=crop',
    ],
    stock: 12,
  },
  {
    name: 'Cargo Pants',
    slug: 'cargo-pants',
    description: 'Celana cargo dengan siluet modern.',
    price: 349000,
    category: 'Bawahan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Khaki', hex: '#C3B091' }, { name: 'Black', hex: '#1A1A1A' }, { name: 'Army', hex: '#4A5D42' }],
    images: [
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=800&h=1000&fit=crop',
    ],
    stock: 22,
  },
  {
    name: 'Knit Polo',
    slug: 'knit-polo',
    description: 'Polo rajut dengan tekstur premium.',
    price: 259000,
    category: 'Atasan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Navy', hex: '#1A2332' }, { name: 'White', hex: '#FFFFFF' }],
    images: [
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1625910513413-5fc421e0fd6a?w=800&h=1000&fit=crop',
    ],
    stock: 15,
  },
  {
    name: 'Wide Leg Trouser',
    slug: 'wide-leg-trouser',
    description: 'Celana wide leg, flowy dan nyaman.',
    price: 379000,
    category: 'Bawahan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Cream', hex: '#EDE6D6' }, { name: 'Black', hex: '#1A1A1A' }],
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=1000&fit=crop',
    ],
    stock: 20,
  },
  {
    name: 'Bomber Jacket',
    slug: 'bomber-jacket',
    description: 'Jaket bomber ringan, gaya jalanan.',
    price: 499000,
    category: 'Outerwear',
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Olive', hex: '#4A5D42' }, { name: 'Black', hex: '#1A1A1A' }],
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop',
    ],
    stock: 10,
  },
]

const heroes = [
  {
    title: 'New Collection',
    subtitle: 'Daily outfit untuk keseharian kamu',
    ctaText: 'Lihat Koleksi',
    ctaLink: '/produk',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    isActive: true,
    order: 0,
  },
  {
    title: 'Linen Series',
    subtitle: 'Ringan, adem, style',
    ctaText: 'Shop Now',
    ctaLink: '/produk',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=600&fit=crop',
    isActive: false,
    order: 1,
  },
]

async function main() {
  console.log('Seeding...')

  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const ownerPassword = process.env.SEED_OWNER_PASSWORD
  if (!adminPassword || !ownerPassword) {
    console.error('ERROR: Set SEED_ADMIN_PASSWORD dan SEED_OWNER_PASSWORD di .env')
    process.exit(1)
  }

  await prisma.user.upsert({
    where: { email: 'admin@gaul.com' },
    update: {},
    create: {
      name: 'Admin GAUL',
      email: 'admin@gaul.com',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      phone: '0812000000',
    },
  })

  await prisma.user.upsert({
    where: { email: 'owner@gaul.com' },
    update: {},
    create: {
      name: 'Owner GAUL',
      email: 'owner@gaul.com',
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      role: 'super_admin',
      phone: '0813000000',
    },
  })

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { images: p.images },
      create: { ...p, isActive: true },
    })
  }

  const existingHero = await prisma.heroSection.count()
  if (existingHero === 0) {
    await prisma.heroSection.createMany({ data: heroes })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())