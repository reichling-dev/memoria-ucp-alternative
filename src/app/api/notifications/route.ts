import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasAnyStaffRole } from '@/lib/config'
import { getUserRoles } from '@/lib/discord-bot'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

interface Notification {
  id: string
  type: 'application_submitted' | 'application_approved' | 'application_denied' | 'application_archived' | 'system'
  title: string
  message: string
  applicationId?: string
  ticketId?: string
  userId?: string
  username?: string
  priority?: string
  reviewerName?: string
  timestamp: string
  read: boolean
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = await getUserRoles(session.discord.id)
    if (!hasAnyStaffRole(userRoles)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let notifications: Notification[] = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
    } catch {
      notifications = []
    }

    // Sort by timestamp, newest first
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const notification = await req.json()

    let notifications: Notification[] = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
    } catch {
      notifications = []
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }

    notifications.push(newNotification)
    await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))

    return NextResponse.json(newNotification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
