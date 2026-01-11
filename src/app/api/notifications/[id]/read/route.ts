import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    let notifications = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: 'No notifications found' }, { status: 404 })
    }

    const notificationIndex = notifications.findIndex((n: { id: string }) => n.id === id)
    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    notifications[notificationIndex].read = true
    await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
