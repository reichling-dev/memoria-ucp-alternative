import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import type { Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, applicationIds, priority, assignedTo } = await req.json()

    if (!action || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const data = await fs.readFile(dataFilePath, 'utf8')
    let applications: Application[] = JSON.parse(data)

    const toProcess = applications.filter(app => applicationIds.includes(app.id))

    if (toProcess.length === 0) {
      return NextResponse.json({ error: 'No applications found' }, { status: 404 })
    }

    let archived: Application[] = []
    try {
      const archivedData = await fs.readFile(archiveFilePath, 'utf8')
      archived = JSON.parse(archivedData)
    } catch {}

    switch (action) {
      case 'assign':
        applications = applications.map(app =>
          applicationIds.includes(app.id)
            ? { ...app, assignedTo }
            : app
        )
        await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))
        break

      case 'priority':
        applications = applications.map(app =>
          applicationIds.includes(app.id)
            ? { ...app, priority }
            : app
        )
        await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))
        break

      case 'archive':
        const toArchive = applications.filter(app => applicationIds.includes(app.id))
        applications = applications.filter(app => !applicationIds.includes(app.id))
        archived.push(...toArchive.map(app => ({ ...app, archivedAt: new Date().toISOString() })))
        await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))
        await fs.writeFile(archiveFilePath, JSON.stringify(archived, null, 2))
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await logActivity({
      type: 'bulk_action',
      userId: session.discord.id,
      userName: session.discord.username,
      details: { action, count: toProcess.length, applicationIds },
    })

    return NextResponse.json({ success: true, count: toProcess.length })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
