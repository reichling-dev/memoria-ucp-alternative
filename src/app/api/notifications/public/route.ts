import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')

export async function GET(request: Request) {
  try {
    let notifications: any[] = []
    try {
      const data = await fs.readFile(notificationsFilePath, 'utf8')
      notifications = JSON.parse(data)
      if (!Array.isArray(notifications)) notifications = []
    } catch {
      return NextResponse.json([])
    }

    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam))) : 50

    const systems = notifications
      .filter((n) => n.type === 'system')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json(systems)
  } catch (error) {
    console.error('Error fetching public notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
