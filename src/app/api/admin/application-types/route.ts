import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import fs from 'fs'
import { logActivity } from '@/lib/activity-log'

const TYPES_FILE = path.join(process.cwd(), 'data', 'application-types.json')

interface AppTypeItem {
  id: string
  name: string
  cooldownDays: number
  uniqueApproved: boolean
  allowMultiplePending: boolean
  fields?: FieldDef[]
}

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox'

interface FieldDef {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
}

function readTypes(): AppTypeItem[] {
  try {
    const data = fs.readFileSync(TYPES_FILE, 'utf-8')
    const arr = JSON.parse(data)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeTypes(types: AppTypeItem[]) {
  fs.writeFileSync(TYPES_FILE, JSON.stringify(types, null, 2))
}

export async function GET() {
  try {
    const list = readTypes()
    return NextResponse.json(list)
  } catch (e) {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, name, cooldownDays = 0, uniqueApproved = false, allowMultiplePending = false, fields = [] } = body as Partial<AppTypeItem>
  if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 })

  const types = readTypes()
  if (types.some(t => t.id === id)) return NextResponse.json({ error: 'Type exists' }, { status: 409 })
  const item: AppTypeItem = { id, name, cooldownDays, uniqueApproved, allowMultiplePending, fields: Array.isArray(fields) ? fields : [] }
  types.push(item)
  writeTypes(types)

  await logActivity({
    type: 'application_type_created',
    userId: (session as any).discord?.id ?? session.user.email ?? 'unknown',
    userName: (session as any).discord?.username ?? session.user.name ?? 'Unknown',
    targetId: id,
    targetName: name,
    details: { cooldownDays, uniqueApproved, allowMultiplePending }
  })

  return NextResponse.json(item, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, name, cooldownDays, uniqueApproved, allowMultiplePending, fields } = body as Partial<AppTypeItem>
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const types = readTypes()
  const idx = types.findIndex(t => t.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  types[idx] = {
    ...types[idx],
    ...(name !== undefined ? { name } : {}),
    ...(cooldownDays !== undefined ? { cooldownDays } : {}),
    ...(uniqueApproved !== undefined ? { uniqueApproved } : {}),
    ...(allowMultiplePending !== undefined ? { allowMultiplePending } : {}),
    ...(fields !== undefined ? { fields: Array.isArray(fields) ? fields : [] } : {}),
  }
  writeTypes(types)

  await logActivity({
    type: 'application_type_updated',
    userId: (session as any).discord?.id ?? session.user.email ?? 'unknown',
    userName: (session as any).discord?.username ?? session.user.name ?? 'Unknown',
    targetId: id,
    targetName: types[idx].name,
    details: { name, cooldownDays, uniqueApproved, allowMultiplePending }
  })

  return NextResponse.json(types[idx])
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const types = readTypes()
  const deletedType = types.find(t => t.id === id)
  const filtered = types.filter(t => t.id !== id)
  if (filtered.length === types.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  writeTypes(filtered)

  await logActivity({
    type: 'application_type_deleted',
    userId: (session as any).discord?.id ?? session.user.email ?? 'unknown',
    userName: (session as any).discord?.username ?? session.user.name ?? 'Unknown',
    targetId: id,
    targetName: deletedType?.name ?? id
  })

  return NextResponse.json({ success: true })
}
