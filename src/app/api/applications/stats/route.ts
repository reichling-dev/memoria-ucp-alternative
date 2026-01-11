import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import type { ApplicationStats, Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let applications: Application[] = []
    let archived: Application[] = []

    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {}

    try {
      const archivedData = await fs.readFile(archiveFilePath, 'utf8')
      archived = JSON.parse(archivedData)
    } catch {}

    const allApplications = [...applications, ...archived]
    const approved = archived.filter(a => a.status === 'approved')
    const denied = archived.filter(a => a.status === 'denied')
    const pending = applications.filter(a => a.status === 'pending' || !a.status)

    // Calculate average review time
    let totalReviewTime = 0
    let reviewedCount = 0
    archived.forEach(app => {
      if (app.reviewedAt && app.timestamp) {
        const reviewTime = new Date(app.reviewedAt).getTime() - new Date(app.timestamp).getTime()
        totalReviewTime += reviewTime
        reviewedCount++
      }
    })
    const averageReviewTime = reviewedCount > 0 ? totalReviewTime / reviewedCount / (1000 * 60 * 60) : 0 // in hours

    // Approval rate
    const approvalRate = archived.length > 0 ? (approved.length / archived.length) * 100 : 0

    // Applications by priority
    const byPriority = {
      low: applications.filter(a => a.priority === 'low').length,
      normal: applications.filter(a => !a.priority || a.priority === 'normal').length,
      high: applications.filter(a => a.priority === 'high').length,
      urgent: applications.filter(a => a.priority === 'urgent').length,
    }

    // Applications by day (last 30 days)
    const byDay: Array<{ date: string; count: number }> = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = allApplications.filter(app => {
        const appDate = new Date(app.timestamp).toISOString().split('T')[0]
        return appDate === dateStr
      }).length
      byDay.push({ date: dateStr, count })
    }

    // Applications by admin
    const adminMap = new Map<string, { adminId: string; adminName: string; count: number }>()
    archived.forEach(app => {
      if (app.reviewer) {
        const existing = adminMap.get(app.reviewer) || { adminId: app.reviewer, adminName: 'Unknown', count: 0 }
        existing.count++
        adminMap.set(app.reviewer, existing)
      }
    })
    const byAdmin = Array.from(adminMap.values())

    const stats: ApplicationStats = {
      total: allApplications.length,
      pending: pending.length,
      approved: approved.length,
      denied: denied.length,
      byPriority,
      averageReviewTime,
      approvalRate,
      byDay,
      byAdmin,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
