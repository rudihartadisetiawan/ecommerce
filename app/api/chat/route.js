import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { chatBus } from '@/lib/chat-bus'
import { serializeProduct } from '@/lib/serialize'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
  const adminList = searchParams.get('adminList') === 'true'
  const targetUserId = searchParams.get('userId')

  if (!prisma.chatMessage) {
    return NextResponse.json([])
  }

  // 1. Admin Inbox: Get list of all customer conversation threads
  if (isAdmin && adminList) {
    const allUsersWithChats = await prisma.user.findMany({
      where: {
        chatMessages: { some: {} },
      },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const conversations = allUsersWithChats.map(u => {
      const lastMsg = u.chatMessages[0]
      const unreadCount = u.chatMessages.filter(m => m.sender === 'customer' && !m.isRead).length
      const initials = (u.name || 'CU')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      return {
        id: u.id,
        userName: u.name,
        userEmail: u.email,
        userAvatar: initials,
        lastMessage: lastMsg ? lastMsg.message : '',
        lastTime: lastMsg
          ? new Date(lastMsg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : '',
        unread: unreadCount,
        online: true,
      }
    })

    return NextResponse.json(conversations)
  }

  // 2. Admin Inbox: Fetch messages for a specific target customer
  if (isAdmin && targetUserId) {
    const userId = Number(targetUserId)
    await prisma.chatMessage.updateMany({
      where: { userId, sender: 'customer', isRead: false },
      data: { isRead: true },
    })

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    const productIds = [...new Set(
      messages
        .filter(m => m.messageType === 'product' && m.metadata?.productId)
        .map(m => Number(m.metadata.productId))
    )]
    const products = productIds.length
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : []
    const productMap = new Map(products.map(p => [p.id, serializeProduct(p)]))

    return NextResponse.json(
      messages.map(m => {
        const base = {
          id: m.id,
          sender: m.sender,
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          createdAt: m.createdAt,
          messageType: m.messageType || 'text',
        }
        if (m.messageType === 'product') {
          const pid = Number(m.metadata?.productId)
          base.metadata = { ...(m.metadata || {}), product: productMap.get(pid) || null }
        } else {
          base.metadata = m.metadata || null
        }
        return base
      })
    )
  }

  // 3. Customer (or user on shop frontend): Fetch own chat history
  const userId = Number(session.user.id)
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  const productIds = [...new Set(
    messages
      .filter(m => m.messageType === 'product' && m.metadata?.productId)
      .map(m => Number(m.metadata.productId))
  )]
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : []
  const productMap = new Map(products.map(p => [p.id, serializeProduct(p)]))

  return NextResponse.json(
    messages.map(m => {
      const base = {
        id: m.id,
        sender: m.sender,
        text: m.message,
        time: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
        messageType: m.messageType || 'text',
      }
      if (m.messageType === 'product') {
        const pid = Number(m.metadata?.productId)
        base.metadata = { ...(m.metadata || {}), product: productMap.get(pid) || null }
      } else {
        base.metadata = m.metadata || null
      }
      return base
    })
  )
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // S-11: Rate limit chat — max 20 pesan per 10 detik
  if (!rateLimit(`chat:${session.user.id}`, 20, 10000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await request.json()
  const { message, targetUserId, productId } = body

  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
  let userId = Number(session.user.id)
  let sender = 'customer'

  if (isAdmin && targetUserId) {
    userId = Number(targetUserId)
    sender = 'admin'
  }

  let messageType = 'text'
  let metadata = null
  let messageText = (message || '').trim()

  if (productId) {
    if (!prisma.product) {
      return NextResponse.json({ error: 'NOT_AVAILABLE' }, { status: 503 })
    }
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
    if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 })
    if (!product.isActive) return NextResponse.json({ error: 'PRODUCT_INACTIVE' }, { status: 400 })

    messageType = 'product'
    metadata = { productId: product.id, productName: product.name, productSlug: product.slug }
    if (!messageText) messageText = product.name
  } else {
    if (!messageText) return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 })
    if (messageText.length > 4000) return NextResponse.json({ error: 'MESSAGE_TOO_LONG' }, { status: 400 })
  }

  if (!prisma.chatMessage) {
    return NextResponse.json({
      id: Date.now(),
      sender,
      text: messageText,
      messageType,
      metadata,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }, { status: 201 })
  }

  const newMsg = await prisma.chatMessage.create({
    data: {
      userId,
      sender,
      message: messageText,
      messageType,
      metadata: metadata || undefined,
    },
  })

  const responseMsg = {
    id: newMsg.id,
    sender: newMsg.sender,
    text: newMsg.message,
    messageType: newMsg.messageType,
    metadata: newMsg.metadata || null,
    time: new Date(newMsg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    createdAt: newMsg.createdAt,
  }

  if (messageType === 'product' && newMsg.metadata?.productId) {
    const product = await prisma.product.findUnique({ where: { id: Number(newMsg.metadata.productId) } })
    if (product) responseMsg.metadata = { ...(newMsg.metadata || {}), product: serializeProduct(product) }
  }

  chatBus.publish({ type: 'message', userId, data: responseMsg })
  chatBus.publish({ type: 'conversation', userId, data: { userId, lastMessage: responseMsg.text, time: responseMsg.time } })

  return NextResponse.json(responseMsg, { status: 201 })
}
