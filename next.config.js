/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'
const isMidtransProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'

// ponytail: midtrans domain berbeda untuk sandbox vs production
const midtransSnap = isMidtransProduction
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com'
const midtransApi = isMidtransProduction
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com'
const midtransSnapAssets = isMidtransProduction
  ? 'https://snap-assets.midtrans.com'
  : 'https://snap-assets.sandbox.midtrans.com'

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              // ponytail: unsafe-eval hanya di dev — React dev mode butuh eval() untuk debugging
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ` +
              `${midtransSnapAssets} ${midtransApi} ${midtransSnap} ` +
              "https://pay.google.com https://gwk.gopayapi.com " +
              "https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              `img-src 'self' data: blob: ${midtransSnapAssets} ${midtransApi} https://picsum.photos https://images.unsplash.com; ` +
              `frame-src 'self' ${midtransSnap} https://pay.google.com; ` +
              `connect-src 'self' ${midtransApi} ${midtransSnap}; ` +
              "manifest-src 'self'",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
