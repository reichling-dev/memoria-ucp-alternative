import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import type { Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const applicationIds = searchParams.get('ids')?.split(',')

    let applications: Application[] = []
    
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {}

    if (includeArchived) {
      try {
        const archivedData = await fs.readFile(archiveFilePath, 'utf8')
        const archived: Application[] = JSON.parse(archivedData)
        applications = [...applications, ...archived]
      } catch {}
    }

    // Filter by IDs if provided
    if (applicationIds && applicationIds.length > 0) {
      applications = applications.filter(app => applicationIds.includes(app.id))
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Timestamp', 'Username', 'Discord ID', 'Discord Username', 'Age', 'Steam ID', 'CFX Account', 'Status', 'Priority', 'Reviewer', 'Reviewed At']
      const rows = applications.map(app => [
        app.id,
        app.timestamp,
        app.username || '',
        app.discord.id,
        app.discord.username,
        app.age.toString(),
        app.steamId,
        app.cfxAccount,
        app.status || 'pending',
        app.priority || 'normal',
        app.reviewer || '',
        app.reviewedAt || '',
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      await logActivity({
        type: 'application_exported',
        userId: session.discord.id,
        userName: session.discord.username,
        details: { format: 'csv', count: applications.length },
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      await logActivity({
        type: 'application_exported',
        userId: session.discord.id,
        userName: session.discord.username,
        details: { format: 'json', count: applications.length },
      })

      return NextResponse.json(applications, {
        headers: {
          'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting applications:', error)
    return NextResponse.json({ error: 'Failed to export applications' }, { status: 500 })
  }
}
