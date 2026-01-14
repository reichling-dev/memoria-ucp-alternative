import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import fs from 'fs/promises'
import path from 'path'
import { authOptions, hasAnyStaffAccess, hasAdminRole } from '@/lib/auth'
import { getUserRoles } from '@/lib/discord-bot'

const DATA_PATH = path.join(process.cwd(), 'data', 'shop-settings.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read shop settings
async function readSettings() {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Return default settings if file doesn't exist
    return { enabled: true }
  }
}

// Write shop settings
async function writeSettings(settings: { enabled: boolean }) {
  await ensureDataDir()
  await fs.writeFile(DATA_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

// GET: Fetch shop settings
export async function GET(req: NextRequest) {
  try {
    const settings = await readSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/shop/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Update shop settings (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has staff access first
    const hasStaff = await hasAnyStaffAccess(session)
    if (!hasStaff) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if user has admin role
    try {
      const roles = await getUserRoles(session.discord?.id || '')
      if (!hasAdminRole(roles)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
    }

    const body = await req.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const settings = { enabled }
    await writeSettings(settings)

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('POST /api/shop/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
