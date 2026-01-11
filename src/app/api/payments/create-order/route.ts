import { NextRequest, NextResponse } from 'next/server'
import { shopConfig } from '@/lib/config'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Order {
  id: string
  orderId: string
  productId: string
  userId: string
  userEmail?: string
  userName?: string
  discordId?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  paypalOrderId?: string
  timestamp: string
  completedAt?: string
}

// Path to store orders (use database in production)
const ORDERS_FILE = join(process.cwd(), 'data', 'orders.json')

function getOrders(): Order[] {
  try {
    if (!existsSync(ORDERS_FILE)) {
      return []
    }
    const data = readFileSync(ORDERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveOrder(order: Order) {
  try {
    const orders = getOrders()
    orders.push(order)
    writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2))
  } catch (error) {
    console.error('Error saving order:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { productId, userId } = await request.json()

    // Validate product exists
    const product = shopConfig.products.find(p => p.id === productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate PayPal is configured
    if (!shopConfig.paypal.clientId) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 500 }
      )
    }

    // Create PayPal order
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with PayPal' },
        { status: 500 }
      )
    }

    const paypalOrder = await createPayPalOrder(
      accessToken,
      product.price,
      product.currency,
      product.name
    )

    if (!paypalOrder || !paypalOrder.id) {
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    // Save local order record
    const discordSession = session as { discord?: { id: string } }
    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: `${Date.now()}`,
      productId,
      userId,
      userEmail: session.user.email,
      userName: session.user.name || undefined,
      discordId: discordSession.discord?.id || undefined,
      amount: product.price,
      currency: product.currency,
      status: 'pending',
      paypalOrderId: paypalOrder.id,
      timestamp: new Date().toISOString(),
    }

    saveOrder(order)

    const approveLink = paypalOrder.links?.find(
      (link: { rel: string; href?: string }) => link.rel === 'approve'
    )
    return NextResponse.json({
      orderId: order.id,
      paypalOrderId: paypalOrder.id,
      approveUrl: approveLink?.href,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

async function getPayPalAccessToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(
      `${shopConfig.paypal.clientId}:${process.env.PAYPAL_SECRET}`
    ).toString('base64')

    const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('PayPal auth error:', error)
    return null
  }
}

async function createPayPalOrder(
  accessToken: string,
  amount: number,
  currency: string,
  description: string
) {
  try {
    const response = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
            description,
          },
        ],
        return_url: `${process.env.NEXTAUTH_URL}/api/payments/capture`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return null
  }
}
