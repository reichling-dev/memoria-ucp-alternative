import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let notifications = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
    } catch {
      return NextResponse.json({ unread: 0 })
    }

    const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length

    return NextResponse.json({ unread: unreadCount })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
  }
}
