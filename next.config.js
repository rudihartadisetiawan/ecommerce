/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'
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
              "https://snap-assets.sandbox.midtrans.com https://api.sandbox.midtrans.com " +
              "https://app.sandbox.midtrans.com " +
              "https://pay.google.com https://gwk.gopayapi.com " +
              "https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: blob: https://snap-assets.sandbox.midtrans.com https://api.sandbox.midtrans.com https://picsum.photos https://images.unsplash.com; " +
              "frame-src 'self' https://app.sandbox.midtrans.com https://pay.google.com; " +
              "connect-src 'self' https://api.sandbox.midtrans.com https://app.sandbox.midtrans.com; " +
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
