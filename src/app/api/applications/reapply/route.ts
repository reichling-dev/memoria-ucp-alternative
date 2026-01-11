import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Application } from '@/lib/types'

const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

const DEFAULT_REAPPLY_COOLDOWN_DAYS = 30
const typesFilePath = path.join(process.cwd(), 'data', 'application-types.json')

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || session.discord.id
    const appType = searchParams.get('type') || 'whitelist'

    let archived: Application[] = []
    try {
      const data = await fs.readFile(archiveFilePath, 'utf8')
      archived = JSON.parse(data)
    } catch {}

    // Helper: get type config
    let typeConfig: { cooldownDays: number; uniqueApproved: boolean } = { cooldownDays: DEFAULT_REAPPLY_COOLDOWN_DAYS, uniqueApproved: false }
    try {
      const tRaw = await (await import('fs/promises')).readFile(typesFilePath, 'utf8')
      const list = JSON.parse(tRaw)
      const found = Array.isArray(list) ? list.find((t: any) => t.id === appType) : null
      if (found) {
        typeConfig.cooldownDays = typeof found.cooldownDays === 'number' ? found.cooldownDays : DEFAULT_REAPPLY_COOLDOWN_DAYS
        typeConfig.uniqueApproved = !!found.uniqueApproved
      }
    } catch {}

    const withType = (app: Application) => (app as any).applicationType ? (app as any).applicationType === appType : appType === 'whitelist'

    // Check pending or approved in current applications file
    let currentApps: Application[] = []
    try {
      const currentRaw = await (await import('fs/promises')).readFile(path.join(process.cwd(), 'data', 'applications.json'), 'utf8')
      currentApps = JSON.parse(currentRaw)
    } catch {}

    const currentUserApps = currentApps.filter(app => app.discord.id === userId && withType(app))
    const pendingExists = currentUserApps.some(app => (app.status || 'pending') === 'pending')
    if (pendingExists) {
      return NextResponse.json({ canReapply: false, message: 'You already have a pending application for this type.' })
    }

    if (typeConfig.uniqueApproved) {
      const approvedInArchive = archived.find(app => app.discord.id === userId && withType(app) && app.status === 'approved')
      if (approvedInArchive) {
        return NextResponse.json({ canReapply: false, message: 'You are already approved for this application type.' })
      }
    }

    // Find user's denied applications for this type
    const userApplications = archived.filter(app => 
      app.discord.id === userId && withType(app) && app.status === 'denied'
    ).sort((a, b) => new Date(b.updatedAt || b.timestamp).getTime() - new Date(a.updatedAt || a.timestamp).getTime())

    if (userApplications.length === 0) {
      return NextResponse.json({ 
        canReapply: true,
        lastDenied: null,
        cooldownEnds: null,
        message: 'No previous denied applications found'
      })
    }

    const lastDenied = userApplications[0]
    const lastDeniedDate = new Date(lastDenied.updatedAt || lastDenied.timestamp)
    const cooldownEnds = new Date(lastDeniedDate)
    cooldownEnds.setDate(cooldownEnds.getDate() + typeConfig.cooldownDays)
    const now = new Date()

    const canReapply = now >= cooldownEnds
    const daysRemaining = Math.max(0, Math.ceil((cooldownEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return NextResponse.json({
      canReapply,
      lastDenied: {
        id: lastDenied.id,
        timestamp: lastDenied.timestamp,
        updatedAt: lastDenied.updatedAt,
        statusReason: lastDenied.statusReason,
      },
      cooldownEnds: cooldownEnds.toISOString(),
      daysRemaining,
      totalDenied: userApplications.length,
    })
  } catch (error) {
    console.error('Error checking re-apply status:', error)
    return NextResponse.json({ error: 'Failed to check re-apply status' }, { status: 500 })
  }
}
