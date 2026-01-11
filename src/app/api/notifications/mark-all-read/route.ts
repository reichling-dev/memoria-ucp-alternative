import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

export async function POST() {
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
      return NextResponse.json({ success: true })
    }

    notifications = notifications.map((n: { read: boolean }) => ({ ...n, read: true }))
    await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
  }
}
