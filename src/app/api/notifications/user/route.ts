import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let notifications: any[] = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
    } catch {
      notifications = []
    }

    // Filter notifications for this user
    const userNotifications = notifications.filter(n => 
      n.isUserNotification === true && n.userId === session.discord.id
    )

    // Sort by timestamp, newest first
    userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(userNotifications)
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
