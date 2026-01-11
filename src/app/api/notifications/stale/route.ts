import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import type { Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')

const STALE_DAYS = 7 // Applications older than 7 days are considered stale

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
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {
      return NextResponse.json({ stale: [], count: 0 })
    }

    const now = new Date()
    const staleThreshold = new Date(now)
    staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS)

    const staleApplications = applications.filter(app => {
      const appDate = new Date(app.timestamp)
      return appDate < staleThreshold && (app.status === 'pending' || !app.status)
    })

    return NextResponse.json({
      stale: staleApplications.map(app => ({
        id: app.id,
        username: app.username,
        timestamp: app.timestamp,
        daysOld: Math.floor((now.getTime() - new Date(app.timestamp).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      count: staleApplications.length,
    })
  } catch (error) {
    console.error('Error fetching stale applications:', error)
    return NextResponse.json({ error: 'Failed to fetch stale applications' }, { status: 500 })
  }
}
