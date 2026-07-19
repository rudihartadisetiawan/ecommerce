import { Snap } from 'midtrans-client'
import crypto from 'crypto'

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
const serverKey = process.env.MIDTRANS_SERVER_KEY

export function snapClient() {
  return new Snap({
    isProduction,
    serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })
}

// ponytail: mapping label paymentMethod (dari web) → kode Midtrans Snap
// Ref: https://docs.midtrans.com/docs/snap-payment-type-selection
const paymentMethodMap = {
  'Transfer BCA': ['bca_va'],
  'Transfer BNI': ['bni_va'],
  'Transfer Mandiri': ['echannel'],      // Mandiri Bill Payment
  gopay: ['gopay'],
  ovo: ['ovo'],
  dana: ['dana'],
  qris: ['qris'],
  // fallback: buka semua metode yang aktif di dashboard
}

export async function createSnapTransaction(order, user, shippingFee = 0) {
  const itemDetails = (order.items ?? []).map((i) => ({
    id: String(i.productId ?? i.id),
    name: i.product?.name ?? `Item ${i.productId}`,
    price: i.priceAtPurchase,
    quantity: i.qty,
  }))

  // Tambah ongkir sebagai line item tersendiri agar total Midtrans cocok
  if (shippingFee > 0) {
    itemDetails.push({
      id: 'ONGKIR',
      name: 'Ongkos Kirim',
      price: shippingFee,
      quantity: 1,
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  // Selalu filter sesuai pilihan user — jika metode tidak dikenal, buka semua (undefined → Midtrans pakai default dashboard)
  // Hanya kirim enabled_payments jika ada mapping — jika undefined, Midtrans buka semua metode aktif di dashboard
  const enabledPayments = paymentMethodMap[order.paymentMethod]
  const parameter = {
    transaction_details: {
      order_id: order.id,
      gross_amount: order.total,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: user?.name ?? 'Guest',
      email: user?.email ?? 'guest@gaul.com',
    },
    ...(enabledPayments && { enabled_payments: enabledPayments }),
    finish_redirect_url:   `${baseUrl}/account/orders/${order.id}`,
    unfinish_redirect_url: `${baseUrl}/account/orders/${order.id}`,  // klik ✕ / batal
    error_redirect_url:    `${baseUrl}/account/orders/${order.id}`,  // error pembayaran
  }

  const snap = snapClient()
  const result = await snap.createTransaction(parameter)
  return { token: result.token, redirectUrl: result.redirect_url }
}

// ponytail: signature verify pakai sha512(order_id+status_code+gross_amount+serverKey)
export function verifyMidtransSignature(body) {
  if (!serverKey) return false // fail-closed: missing key = invalid signature
  const expected = crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`, 'utf8')
    .digest('hex')
  return body.signature_key === expected
}

export function mapTransactionStatus(status) {
  switch (status) {
    case 'capture':
    case 'settlement':
      return 'paid'
    case 'pending':
      return 'pending'
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
    case 'refund':
      return 'cancelled'
    default:
      return null
  }
}