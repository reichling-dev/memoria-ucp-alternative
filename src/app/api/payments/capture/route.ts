import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { logActivity } from '@/lib/activity-log'

const ORDERS_FILE = join(process.cwd(), 'data', 'orders.json')
const TRANSACTIONS_FILE = join(process.cwd(), 'data', 'transactions.json')

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

interface Transaction {
  id: string
  orderId: string
  paypalOrderId: string
  paypalTransactionId: string
  productId: string
  userId: string
  amount: number
  currency: string
  status: 'completed' | 'failed'
  timestamp: string
  payerEmail?: string
  payerName?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/pricing?error=missing_token', request.url))
    }

    // Capture the PayPal payment
    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return NextResponse.redirect(new URL('/pricing?error=auth_failed', request.url))
    }

    const captureResult = await capturePayPalOrder(accessToken, token)
    if (!captureResult.success || !captureResult.transaction) {
      return NextResponse.redirect(
        new URL(
          `/pricing?error=capture_failed&details=${encodeURIComponent(captureResult.error || 'Unknown error')}`,
          request.url
        )
      )
    }

    // Save transaction
    saveTransaction(captureResult.transaction)

    // Update local order status
    updateOrderStatus(captureResult.transaction.orderId, 'completed')
    
    // Log activity
    if (captureResult.transaction) {
      const order = getOrders().find((o: Order) => o.id === captureResult.transaction?.orderId)
      await logActivity({
        type: 'purchase_completed',
        userId: order?.discordId || order?.userId || 'unknown',
        userName: order?.userName || order?.userEmail || 'Unknown User',
        details: {
          action: 'purchase_completed',
          orderId: captureResult.transaction.orderId,
          productId: captureResult.transaction.productId,
          amount: captureResult.transaction.amount,
          currency: captureResult.transaction.currency,
          transactionId: captureResult.transaction.paypalTransactionId,
          description: `Purchased ${captureResult.transaction.productId} for $${captureResult.transaction.amount} ${captureResult.transaction.currency}`,
        },
      })
    }
    
    // Send Discord notification
    await notifyDiscordPayment(captureResult.transaction)

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/pricing?success=true&orderId=${captureResult.transaction.orderId}`,
        request.url
      )
    )
  } catch (error) {
    console.error('Capture error:', error)
    return NextResponse.redirect(new URL('/pricing?error=internal_error', request.url))
  }
}

async function getPayPalAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const secret = process.env.PAYPAL_SECRET

    if (!clientId || !secret) {
      console.error('PayPal credentials not configured')
      return null
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')

    const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      console.error('PayPal auth failed:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('PayPal access token error:', error)
    return null
  }
}

async function capturePayPalOrder(
  accessToken: string,
  orderId: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Payment capture failed',
      }
    }

    // Extract transaction details
    const purchase = data.purchase_units?.[0]
    const capture = purchase?.payments?.captures?.[0]

    if (!capture?.id) {
      return {
        success: false,
        error: 'Invalid capture response',
      }
    }

    // Get local order info
    const orders = getOrders() as Order[]
    const localOrder = orders.find(o => o.paypalOrderId === orderId)

    if (!localOrder) {
      return {
        success: false,
        error: 'Order not found',
      }
    }

    const transaction: Transaction = {
      id: capture.id,
      orderId: localOrder.id,
      paypalOrderId: orderId,
      paypalTransactionId: capture.id,
      productId: localOrder.productId,
      userId: localOrder.userId,
      amount: localOrder.amount,
      currency: localOrder.currency,
      status: 'completed',
      timestamp: new Date().toISOString(),
      payerEmail: data.payer?.email_address,
      payerName: data.payer?.name?.given_name,
    }

    return {
      success: true,
      transaction,
    }
  } catch (error) {
    console.error('PayPal capture error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Capture failed',
    }
  }
}

function getOrders() {
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

function updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'failed') {
  try {
    const orders = getOrders() as Order[]
    const order = orders.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.completedAt = new Date().toISOString()
      writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2))
    }
  } catch (error) {
    console.error('Error updating order status:', error)
  }
}

function saveTransaction(transaction: Transaction) {
  try {
    let transactions: Transaction[] = []
    if (existsSync(TRANSACTIONS_FILE)) {
      const data = readFileSync(TRANSACTIONS_FILE, 'utf-8')
      transactions = JSON.parse(data)
    }
    transactions.push(transaction)
    writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2))
  } catch (error) {
    console.error('Error saving transaction:', error)
  }
}

async function notifyDiscordPayment(transaction: Transaction) {
  try {
    const webhookUrl = process.env.DISCORD_PAYMENT_WEBHOOK_URL

    if (!webhookUrl) {
      console.log('Discord webhook not configured, skipping notification')
      return
    }

    const embed = {
      title: '💰 New Payment Received',
      color: 0x00ff00,
      fields: [
        {
          name: 'Order ID',
          value: transaction.orderId,
          inline: true,
        },
        {
          name: 'Amount',
          value: `$${transaction.amount.toFixed(2)} ${transaction.currency}`,
          inline: true,
        },
        {
          name: 'Product ID',
          value: transaction.productId,
          inline: true,
        },
        {
          name: 'User ID',
          value: transaction.userId,
          inline: true,
        },
        {
          name: 'Payer Email',
          value: transaction.payerEmail || 'N/A',
          inline: true,
        },
        {
          name: 'Status',
          value: transaction.status,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (error) {
    console.error('Discord notification error:', error)
  }
}
