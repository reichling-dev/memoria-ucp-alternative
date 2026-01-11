import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { getAdminDiscordIds } from '@/lib/config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return list of admin IDs (in a real app, you might want to fetch admin names from Discord)
    const adminIds = getAdminDiscordIds()

    return NextResponse.json({ admins: adminIds.map(id => ({ id, name: `Admin ${id.slice(0, 8)}` })) })
  } catch (error) {
    console.error('Error fetching admin list:', error)
    return NextResponse.json({ error: 'Failed to fetch admin list' }, { status: 500 })
  }
}
