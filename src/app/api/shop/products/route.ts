import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions, hasAnyStaffAccess, hasAdminRole } from '@/lib/auth'
import { getUserRoles } from '@/lib/discord-bot'
import { shopConfig, ShopProduct } from '@/lib/config'

const PRODUCTS_FILE = join(process.cwd(), 'data', 'shop-products.json')

function readProducts(): ShopProduct[] {
  try {
    if (!existsSync(PRODUCTS_FILE)) {
      return shopConfig.products
    }
    const data = readFileSync(PRODUCTS_FILE, 'utf-8')
    return JSON.parse(data) as ShopProduct[]
  } catch (error) {
    console.error('Error reading products file:', error)
    return shopConfig.products
  }
}

function writeProducts(products: ShopProduct[]) {
  try {
    writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
  } catch (error) {
    console.error('Error writing products file:', error)
  }
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return { authorized: false, session: null }
  const hasStaff = await hasAnyStaffAccess(session)
  if (!hasStaff) return { authorized: false, session }
  try {
    const roles = await getUserRoles(session.discord?.id || '')
    if (!hasAdminRole(roles)) return { authorized: false, session }
    return { authorized: true, session }
  } catch (error) {
    console.error('Error checking admin role:', error)
    return { authorized: false, session }
  }
}

export async function GET() {
  const products = readProducts()
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const products = readProducts()

  const newProduct: ShopProduct = {
    id: body.id || `product_${Date.now()}`,
    name: body.name,
    description: body.description || '',
    price: Number(body.price) || 0,
    currency: body.currency || 'USD',
    icon: body.icon || '🛒',
    category: body.category || 'coins',
    image: body.image,
    bonus: body.bonus ? Number(body.bonus) : undefined,
    highlighted: !!body.highlighted,
    discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) : undefined,
    features: Array.isArray(body.features)
      ? body.features
      : typeof body.features === 'string'
        ? body.features.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [],
  }

  products.push(newProduct)
  writeProducts(products)
  return NextResponse.json(newProduct, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const products = readProducts()
  const idx = products.findIndex(p => p.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const updated: ShopProduct = {
    ...products[idx],
    ...body,
    price: body.price !== undefined ? Number(body.price) : products[idx].price,
    bonus: body.bonus !== undefined ? Number(body.bonus) : products[idx].bonus,
    highlighted: body.highlighted !== undefined ? !!body.highlighted : products[idx].highlighted,
    discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) : products[idx].discountPercent,
    features: Array.isArray(body.features)
      ? body.features
      : typeof body.features === 'string'
        ? body.features.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : products[idx].features,
  }

  products[idx] = updated
  writeProducts(products)
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const products = readProducts()
  const filtered = products.filter(p => p.id !== body.id)
  writeProducts(filtered)
  return NextResponse.json({ success: true })
}
