import { NextResponse } from 'next/server'
import fs from 'fs/promises'
// import fs sync variant if needed
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const notificationsPath = path.join(dataDir, 'notifications.json')
const announcementsPath = path.join(dataDir, 'announcements.json')
const rulesPath = path.join(dataDir, 'rules.json')
const applicationsPath = path.join(dataDir, 'applications.json')
const statePath = path.join(dataDir, 'notification-state.json')

async function ensureDataDir() {
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

export async function GET(request: Request) {
  try {
    await ensureDataDir()

    const url = new URL(request.url)
    const secret = url.searchParams.get('secret') || request.headers.get('x-cron-secret') || ''
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let state: { lastRun: string } = { lastRun: '' }
    try {
      const s = await fs.readFile(statePath, 'utf8')
      state = JSON.parse(s)
    } catch {
      // first run: initialize and skip generating historical notifications
      const nowIso = new Date().toISOString()
      await fs.writeFile(statePath, JSON.stringify({ lastRun: nowIso }, null, 2))
      return NextResponse.json({ initialized: true, message: 'State initialized; no notifications generated on first run.' })
    }

    const lastRun = new Date(state.lastRun || 0)
    const now = new Date()

    // Load existing notifications
    type NotificationItem = {
      id: string
      timestamp: string
      read: boolean
      type: 'application_submitted' | 'application_approved' | 'application_denied' | 'system'
      title: string
      message: string
      applicationId?: string
      userId?: string
      username?: string
      priority?: string
    }

    let notifications: NotificationItem[] = []
    try {
      const n = await fs.readFile(notificationsPath, 'utf8')
      notifications = JSON.parse(n)
      if (!Array.isArray(notifications)) notifications = []
    } catch {
      notifications = []
    }

    let created = 0

    // Announcements since last run
    try {
      const aRaw = await fs.readFile(announcementsPath, 'utf8')
      const anns = JSON.parse(aRaw)
      if (Array.isArray(anns)) {
        for (const ann of anns) {
          const createdAt = new Date(ann.createdAt)
          const updatedAt = ann.updatedAt ? new Date(ann.updatedAt) : null
          if ((createdAt > lastRun) || (updatedAt && updatedAt > lastRun)) {
            notifications.push({
              id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
              timestamp: new Date().toISOString(),
              read: false,
              type: 'system',
              title: updatedAt && updatedAt > lastRun ? 'Announcement Updated' : 'New Announcement',
              message: `${ann.title}: ${ann.content.substring(0, 140)}${ann.content.length > 140 ? '…' : ''}`,
              priority: ann.priority || 'normal',
            })
            created++
          }
        }
      }
    } catch {}

    // Rules changed since last run (based on file mtime)
    try {
      const stats = await fs.stat(rulesPath)
      const mtime = stats.mtime
      if (mtime > lastRun) {
        notifications.push({
          id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
          timestamp: new Date().toISOString(),
          read: false,
          type: 'system',
          title: 'Rules Updated',
          message: 'Server rules have been updated. Please review the changes.',
          priority: 'medium',
        })
        created++
      }
    } catch {}

    // Applications submitted since last run (ensure not duplicated)
    try {
      const appsRaw = await fs.readFile(applicationsPath, 'utf8')
      const apps = JSON.parse(appsRaw)
      if (Array.isArray(apps)) {
        for (const app of apps) {
          const ts = new Date(app.timestamp)
          if (ts > lastRun) {
            const exists = notifications.some((n) => n.type === 'application_submitted' && n.applicationId === app.id)
            if (!exists) {
              notifications.push({
                id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
                timestamp: new Date().toISOString(),
                read: false,
                type: 'application_submitted',
                title: 'New Application Submitted',
                message: `${app?.discord?.username || 'A user'} has submitted a whitelist application`,
                applicationId: app.id,
                userId: app?.discord?.id,
                username: app?.discord?.username,
                priority: app.priority || 'normal',
              })
              created++
            }
          }
        }
      }
    } catch {}

    // Persist notifications if any created
    if (created > 0) {
      await fs.writeFile(notificationsPath, JSON.stringify(notifications, null, 2))
    }

    // Update state
    await fs.writeFile(statePath, JSON.stringify({ lastRun: now.toISOString() }, null, 2))

    return NextResponse.json({ success: true, created, lastRun: state.lastRun, now: now.toISOString() })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
