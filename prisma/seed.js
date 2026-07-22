import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function img(id) { return `https://images.unsplash.com/${id}?w=800&h=1000&fit=crop` }

const products = [
  // ===== ATASAN (15) =====
  { name:'Linen Overshirt', slug:'linen-overshirt', desc:'Overshirt linen ringan untuk layering sehari-hari.', price:389000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Natural',hex:'#E8DCC8'},{name:'Charcoal',hex:'#1A1A1A'},{name:'Olive',hex:'#7B8A6F'}], images:[img('photo-1596755094514-f87e34085b2c'),img('photo-1621072156002-e2fccdc0b176'),img('photo-1598032895455-1e992e4bc06c')], stock:25 },
  { name:'Cotton Tee', slug:'cotton-tee', desc:'T-shirt katun premium, soft touch.', price:189000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#1A1A1A'},{name:'Clay',hex:'#C4A882'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1583743814966-8936f5b7be1a'),img('photo-1618354691373-d851c5c3a990')], stock:40 },
  { name:'Knit Polo', slug:'knit-polo', desc:'Polo rajut dengan tekstur premium.', price:259000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Navy',hex:'#1A2332'},{name:'White',hex:'#FFFFFF'}], images:[img('photo-1586363104862-3a5e2ab60d99'),img('photo-1625910513413-5fc421e0fd6a')], stock:15 },
  { name:'Striped Henley', slug:'striped-henley', desc:'Henley bergaris kasual, cocok untuk santai.', price:219000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Navy Stripe',hex:'#1A2332'},{name:'Burgundy Stripe',hex:'#6E2C3D'}], images:[img('photo-1583743814966-8936f5b7be1a'),img('photo-1618354691373-d851c5c3a990')], stock:30 },
  { name:'Oversized Sweater', slug:'oversized-sweater', desc:'Sweater oversized berbahan rajut tebal.', price:349000, cat:'Atasan', sizes:['M','L','XL'], colors:[{name:'Cream',hex:'#EDE6D6'},{name:'Grey',hex:'#8C8C8C'},{name:'Maroon',hex:'#6E2C3D'}], images:[img('photo-1576566588028-4147f3842f27'),img('photo-1620799140408-edc6dcb6d633')], stock:20 },
  { name:'Casual Button Down', slug:'casual-button-down', desc:'Kemeja casual potongan relaxed untuk sehari-hari.', price:289000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Light Blue',hex:'#A8C5D6'},{name:'White',hex:'#FFFFFF'},{name:'Pink',hex:'#E8AFAF'}], images:[img('photo-1596755094514-f87e34085b2c'),img('photo-1621072156002-e2fccdc0b176')], stock:22 },
  { name:'Boxy Tee', slug:'boxy-tee', desc:'T-shirt potongan boxy, oversized fit.', price:179000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'White',hex:'#FFFFFF'},{name:'Sage',hex:'#9CAF88'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1583743814966-8936f5b7be1a')], stock:50 },
  { name:'Flannel Shirt', slug:'flannel-shirt', desc:'Kemeja flanel kotak-kotak classic.', price:269000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Red Plaid',hex:'#8B2C2C'},{name:'Blue Plaid',hex:'#2C4A8B'}], images:[img('photo-1596755094514-f87e34085b2c'),img('photo-1621072156002-e2fccdc0b176')], stock:18 },
  { name:'Turtleneck Knit', slug:'turtleneck-knit', desc:'Turtleneck rajut halus, hangat dan stylish.', price:319000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Beige',hex:'#E8DCC8'},{name:'Burgundy',hex:'#6E2C3D'}], images:[img('photo-1576566588028-4147f3842f27'),img('photo-1620799140408-edc6dcb6d633')], stock:14 },
  { name:'Sleeveless Vest', slug:'sleeveless-vest', desc:'Rompi tanpa lengan untuk layer tambahan.', price:239000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Olive',hex:'#4A5D42'},{name:'Charcoal',hex:'#3A3A3A'}], images:[img('photo-1586363104862-3a5e2ab60d99'),img('photo-1625910513413-5fc421e0fd6a')], stock:16 },
  { name:'Muscle Tee', slug:'muscle-tee', desc:'T-shirt tanpa lengan, cocok untuk olahraga atau santai.', price:159000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Grey',hex:'#8C8C8C'},{name:'Navy',hex:'#1A2332'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1618354691373-d851c5c3a990')], stock:35 },
  { name:'Denim Shirt', slug:'denim-shirt', desc:'Kemeja denim classic yang never out of style.', price:329000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Light Wash',hex:'#7B9DB5'},{name:'Dark Wash',hex:'#2B4162'}], images:[img('photo-1596755094514-f87e34085b2c'),img('photo-1621072156002-e2fccdc0b176')], stock:12 },
  { name:'Hawaiian Shirt', slug:'hawaiian-shirt', desc:'Kemeja motif floral santai untuk suasana liburan.', price:249000, cat:'Atasan', sizes:['S','M','L','XL'], colors:[{name:'Tropic Blue',hex:'#2E86AB'},{name:'Sunset Red',hex:'#C75B39'}], images:[img('photo-1596755094514-f87e34085b2c'),img('photo-1621072156002-e2fccdc0b176')], stock:28 },
  { name:'Quarter Zip Sweater', slug:'quarter-zip-sweater', desc:'Sweater dengan resleting 1/4, casual dan hangat.', price:359000, cat:'Atasan', sizes:['M','L','XL'], colors:[{name:'Navy',hex:'#1A2332'},{name:'Burgundy',hex:'#6E2C3D'},{name:'Forest',hex:'#2D4A2D'}], images:[img('photo-1576566588028-4147f3842f27'),img('photo-1620799140408-edc6dcb6d633')], stock:17 },
  { name:'Cropped Hoodie', slug:'cropped-hoodie', desc:'Hoodie cropped potongan modern.', price:299000, cat:'Atasan', sizes:['S','M','L'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Grey',hex:'#8C8C8C'},{name:'Lavender',hex:'#B8A9C9'}], images:[img('photo-1576566588028-4147f3842f27'),img('photo-1620799140408-edc6dcb6d633')], stock:24 },

  // ===== BAWAHAN (12) =====
  { name:'Relaxed Chino', slug:'relaxed-chino', desc:'Chino potongan relaxed untuk siluet santai.', price:329000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Khaki',hex:'#C3B091'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1624378439575-d8705ad7ae80'),img('photo-1473966968600-fa801b869a1a')], stock:18 },
  { name:'Cargo Pants', slug:'cargo-pants', desc:'Celana cargo dengan siluet modern.', price:349000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Khaki',hex:'#C3B091'},{name:'Black',hex:'#1A1A1A'},{name:'Army',hex:'#4A5D42'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1548883354-7622d03aca27'),img('photo-1584865288642-42078afe6942')], stock:22 },
  { name:'Wide Leg Trouser', slug:'wide-leg-trouser', desc:'Celana wide leg, flowy dan nyaman.', price:379000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Cream',hex:'#EDE6D6'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1594938298603-c8148c4dae35'),img('photo-1506629082955-511b1aa562c8')], stock:20 },
  { name:'Slim Jean', slug:'slim-jean', desc:'Jeans slim fit stretch nyaman.', price:399000, cat:'Bawahan', sizes:['28','30','32','34'], colors:[{name:'Dark Blue',hex:'#1A2A3A'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1473966968600-fa801b869a1a')], stock:30 },
  { name:'Loose Shorts', slug:'loose-shorts', desc:'Celana pendek longgar, adem untuk cuaca panas.', price:189000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Khaki',hex:'#C3B091'},{name:'Navy',hex:'#1A2332'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1584865288642-42078afe6942')], stock:40 },
  { name:'Pleated Skirt', slug:'pleated-skirt', desc:'Rok plisket panjang elegan.', price:289000, cat:'Bawahan', sizes:['S','M','L'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Forest',hex:'#2D4A2D'}], images:[img('photo-1594938298603-c8148c4dae35'),img('photo-1506629082955-511b1aa562c8')], stock:15 },
  { name:'Culotte Pants', slug:'culotte-pants', desc:'Celana culotte lebar dengan potongan stylish.', price:359000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Cream',hex:'#EDE6D6'},{name:'Black',hex:'#1A1A1A'},{name:'Olive',hex:'#4A5D42'}], images:[img('photo-1624378439575-d8705ad7ae80'),img('photo-1473966968600-fa801b869a1a')], stock:16 },
  { name:'Jogger Pants', slug:'jogger-pants', desc:'Celana jogger bahan fleece, super nyaman.', price:269000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Grey',hex:'#8C8C8C'},{name:'Black',hex:'#1A1A1A'},{name:'Navy',hex:'#1A2332'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1548883354-7622d03aca27')], stock:35 },
  { name:'Straight Jean', slug:'straight-jean', desc:'Jeans straight leg, fit universal.', price:379000, cat:'Bawahan', sizes:['28','30','32','34'], colors:[{name:'Mid Blue',hex:'#4A6FA5'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1473966968600-fa801b869a1a')], stock:25 },
  { name:'Mini Skirt', slug:'mini-skirt', desc:'Rok mini casual untuk tampilan playful.', price:219000, cat:'Bawahan', sizes:['S','M','L'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Plaid',hex:'#8B2C2C'}], images:[img('photo-1594938298603-c8148c4dae35'),img('photo-1506629082955-511b1aa562c8')], stock:20 },
  { name:'Tapered Trouser', slug:'tapered-trouser', desc:'Celana formal tapered untuk gaya rapi.', price:389000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Charcoal',hex:'#3A3A3A'},{name:'Navy',hex:'#1A2332'}], images:[img('photo-1624378439575-d8705ad7ae80'),img('photo-1473966968600-fa801b869a1a')], stock:12 },
  { name:'Linen Pants', slug:'linen-pants', desc:'Celana linen ringan, cocok untuk tropis.', price:339000, cat:'Bawahan', sizes:['S','M','L','XL'], colors:[{name:'Natural',hex:'#E8DCC8'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1624378439575-d8705ad7ae80'),img('photo-1473966968600-fa801b869a1a')], stock:18 },

  // ===== OUTERWEAR (8) =====
  { name:'Denim Jacket', slug:'denim-jacket', desc:'Jaket denim klasik, cocok untuk lapisan luar.', price:459000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Indigo',hex:'#2B4162'},{name:'Stonewash',hex:'#7B8FA1'}], images:[img('photo-1576995853123-5a10305d93c0'),img('photo-1611312449408-fcece27cdbb7')], stock:12 },
  { name:'Bomber Jacket', slug:'bomber-jacket', desc:'Jaket bomber ringan, gaya jalanan.', price:499000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Olive',hex:'#4A5D42'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1591047139829-d91aecb6caea'),img('photo-1551028719-00167b16eac5')], stock:10 },
  { name:'Trench Coat', slug:'trench-coat', desc:'Mantel trench elegan untuk segala cuaca.', price:599000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Beige',hex:'#D4C5A9'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1576995853123-5a10305d93c0'),img('photo-1611312449408-fcece27cdbb7')], stock:8 },
  { name:'Puffer Vest', slug:'puffer-vest', desc:'Rompi puffer hangat tanpa lengan.', price:329000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Navy',hex:'#1A2332'},{name:'Olive',hex:'#4A5D42'}], images:[img('photo-1576995853123-5a10305d93c0'),img('photo-1611312449408-fcece27cdbb7')], stock:14 },
  { name:'Leather Jacket', slug:'leather-jacket', desc:'Jaket kulit sintetis premium.', price:699000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Brown',hex:'#6B4226'}], images:[img('photo-1551028719-00167b16eac5'),img('photo-1591047139829-d91aecb6caea')], stock:6 },
  { name:'Cardigan', slug:'cardigan', desc:'Cardigan rajut panjang, nyaman dan stylish.', price:359000, cat:'Outerwear', sizes:['S','M','L','XL'], colors:[{name:'Cream',hex:'#EDE6D6'},{name:'Charcoal',hex:'#3A3A3A'}], images:[img('photo-1576566588028-4147f3842f27'),img('photo-1620799140408-edc6dcb6d633')], stock:15 },
  { name:'Windbreaker', slug:'windbreaker', desc:'Jaket windbreaker ringan anti angin.', price:399000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Lime',hex:'#A8C832'},{name:'Blue',hex:'#2E86AB'}], images:[img('photo-1551028719-00167b16eac5'),img('photo-1591047139829-d91aecb6caea')], stock:20 },
  { name:'Blazer Casual', slug:'blazer-casual', desc:'Blazer casual potongan relaxed untuk smart casual.', price:529000, cat:'Outerwear', sizes:['M','L','XL'], colors:[{name:'Navy',hex:'#1A2332'},{name:'Charcoal',hex:'#3A3A3A'}], images:[img('photo-1576995853123-5a10305d93c0'),img('photo-1611312449408-fcece27cdbb7')], stock:9 },

  // ===== AKSESORIS (8) =====
  { name:'Canvas Tote', slug:'canvas-tote', desc:'Tas tote kanvas untuk bawaan sehari-hari.', price:149000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Natural',hex:'#E8DCC8'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:30 },
  { name:'Bucket Hat', slug:'bucket-hat', desc:'Topi bucket casual dari bahan katun.', price:119000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Olive',hex:'#4A5D42'},{name:'Cream',hex:'#EDE6D6'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1618354691373-d851c5c3a990')], stock:45 },
  { name:'Leather Belt', slug:'leather-belt', desc:'Sabuk kulit sintetis dengan buckle minimalis.', price:179000, cat:'Aksesoris', sizes:['S','M','L'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Brown',hex:'#6B4226'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1548883354-7622d03aca27')], stock:35 },
  { name:'Beanie', slug:'beanie', desc:'Beanie rajut hangat untuk musim dingin.', price:99000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Navy',hex:'#1A2332'},{name:'Burgundy',hex:'#6E2C3D'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1618354691373-d851c5c3a990')], stock:50 },
  { name:'Sling Bag', slug:'sling-bag', desc:'Tas selempang kecil, praktis untuk bepergian.', price:199000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Olive',hex:'#4A5D42'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1548883354-7622d03aca27')], stock:25 },
  { name:'Sunglasses', slug:'sunglasses', desc:'Kacamata hitam dengan frame retro.', price:259000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Black Frame',hex:'#1A1A1A'},{name:'Tortoise',hex:'#8B6914'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1618354691373-d851c5c3a990')], stock:40 },
  { name:'Wrist Watch', slug:'wrist-watch', desc:'Jam tangan minimalis dengan strap kulit.', price:429000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Silver',hex:'#C0C0C0'},{name:'Gold',hex:'#D4AF37'}], images:[img('photo-1517438476312-10d79c077509'),img('photo-1548883354-7622d03aca27')], stock:20 },
  { name:'Scarf', slug:'scarf', desc:'Syall rajut lembut, hangat di leher.', price:139000, cat:'Aksesoris', sizes:['One Size'], colors:[{name:'Grey',hex:'#8C8C8C'},{name:'Burgundy',hex:'#6E2C3D'},{name:'Navy',hex:'#1A2332'}], images:[img('photo-1521572163474-6864f9cf17ab'),img('photo-1618354691373-d851c5c3a990')], stock:35 },

  // ===== SEPATU (7) =====
  { name:'Canvas Sneakers', slug:'canvas-sneakers', desc:'Sepatu kanvas klasik, nyaman sehari-hari.', price:299000, cat:'Sepatu', sizes:['39','40','41','42','43'], colors:[{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:30 },
  { name:'Loafers', slug:'loafers', desc:'Sepatu loafers kulit sintetis stylish.', price:379000, cat:'Sepatu', sizes:['39','40','41','42'], colors:[{name:'Brown',hex:'#6B4226'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:15 },
  { name:'Slip On', slug:'slip-on', desc:'Sepatu slip on tanpa tali, praktis.', price:249000, cat:'Sepatu', sizes:['39','40','41','42','43'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Navy',hex:'#1A2332'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:25 },
  { name:'Running Shoes', slug:'running-shoes', desc:'Sepatu lari ringan dengan bantalan empuk.', price:499000, cat:'Sepatu', sizes:['39','40','41','42','43','44'], colors:[{name:'Black-White',hex:'#1A1A1A'},{name:'Navy-Blue',hex:'#1A2332'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:18 },
  { name:'Chelsea Boots', slug:'chelsea-boots', desc:'Boots chelsea kulit, tampilan maskulin.', price:529000, cat:'Sepatu', sizes:['39','40','41','42','43'], colors:[{name:'Black',hex:'#1A1A1A'},{name:'Brown',hex:'#6B4226'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:10 },
  { name:'Sandals', slug:'sandals', desc:'Sandal kulit premium untuk santai.', price:179000, cat:'Sepatu', sizes:['39','40','41','42','43'], colors:[{name:'Brown',hex:'#6B4226'},{name:'Black',hex:'#1A1A1A'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:40 },
  { name:'High Top Sneakers', slug:'high-top-sneakers', desc:'Sepatu high top kanvas gaya retro.', price:349000, cat:'Sepatu', sizes:['39','40','41','42','43'], colors:[{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#1A1A1A'},{name:'Red',hex:'#C75B39'}], images:[img('photo-1548883354-7622d03aca27'),img('photo-1517438476312-10d79c077509')], stock:22 },
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

  const pwHash = await bcrypt.hash(adminPassword, 10)
  const ownerHash = await bcrypt.hash(ownerPassword, 10)
  await prisma.user.upsert({
    where: { email: 'admin@gaul.com' },
    update: { passwordHash: pwHash, role: 'admin', name: 'Admin GAUL' },
    create: {
      name: 'Admin GAUL',
      email: 'admin@gaul.com',
      passwordHash: pwHash,
      role: 'admin',
      phone: '0812000000',
    },
  })

  await prisma.user.upsert({
    where: { email: 'owner@gaul.com' },
    update: { passwordHash: ownerHash, role: 'super_admin', name: 'Rudi' },
    create: {
      name: 'Rudi',
      email: 'owner@gaul.com',
      passwordHash: ownerHash,
      role: 'super_admin',
      phone: '0813000000',
    },
  })

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { images: p.images },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        price: p.price,
        category: p.cat,
        sizes: p.sizes,
        colors: p.colors,
        images: p.images,
        stock: p.stock,
        isActive: true,
      },
    })
  }

  const existingHero = await prisma.heroSection.count()
  if (existingHero === 0) {
    await prisma.heroSection.createMany({ data: heroes })
  }

  const count = await prisma.product.count()
  console.log(`Seed complete. ${count} produk tersedia.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
