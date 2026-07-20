import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!rateLimit(`forgot:${ip}`, 3, 3600000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await request.json()
  const { email } = body
  if (!email) return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    // Jangan kasih tahu email ditemukan atau tidak — security best practice
    return NextResponse.json({ ok: true })
  }

  // Hapus token lama untuk email ini
  await prisma.passwordReset.deleteMany({ where: { email: email.toLowerCase() } })

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.passwordReset.create({
    data: {
      email: email.toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/account/reset-password/${token}`

  // ponytail: dev mode — tampilkan link di console, production kirim email beneran
  if (process.env.NODE_ENV === 'development') {
    console.log('')
    console.log('╔══════════════════════════════════════════════╗')
    console.log('║        🔐 RESET PASSWORD LINK               ║')
    console.log('╠══════════════════════════════════════════════╣')
    console.log(`║  ${resetLink}`)
    console.log('╚══════════════════════════════════════════════╝')
    console.log('')
  }

  // Kirim email via Resend (jika API key diset)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const name = user.name || email.split('@')[0]
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'GAUL <noreply@gaul.com>',
          to: email.toLowerCase(),
          subject: 'Reset Password — GAUL Daily Outfit',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#1C1C1A;">Reset Password GAUL</h2>
              <p>Hai ${name},</p>
              <p>Kami menerima permintaan reset password untuk akun GAUL kamu.</p>
              <a href="${resetLink}" style="display:inline-block;background:#1C1C1A;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;margin:16px 0;">Reset Password</a>
              <p style="color:#6B655A;font-size:12px;">Link berlaku 1 jam. Abaikan email ini jika kamu tidak meminta reset.</p>
            </div>
          `,
        }),
      })
    } catch (e) {
      console.error('Gagal kirim email reset:', e.message)
    }
  }

  return NextResponse.json({ ok: true })
}
