import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import type { Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { priority, systemUpdate } = await req.json()

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    // Check if this is a system update (from Discord bot)
    const isSystemUpdate = systemUpdate === process.env.NEXTAUTH_SECRET;

    if (!isSystemUpdate) {
      // Regular admin authentication required
      const session = await getServerSession(authOptions)
      if (!session || !session.discord) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!(await hasAnyStaffAccess(session))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications: Application[] = JSON.parse(data)
    const index = applications.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = applications[index]
    const oldPriority = application.priority || 'normal'

    applications[index] = {
      ...application,
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
    }

    await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))

    if (!isSystemUpdate) {
      // Only log manual admin changes
      const session = await getServerSession(authOptions)
      if (session?.discord) {
        await logActivity({
          type: 'application_priority_changed',
          userId: session.discord.id,
          userName: session.discord.username,
          targetId: id,
          targetName: application.username,
          details: { oldPriority, newPriority: priority },
        })
      }
    } else {
      // Log system automatic changes
      await logActivity({
        type: 'application_priority_changed',
        userId: 'system',
        userName: 'System (Auto)',
        targetId: id,
        targetName: application.username,
        details: { oldPriority, newPriority: priority, reason: 'Discord role change' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating priority:', error)
    return NextResponse.json({ error: 'Failed to update priority' }, { status: 500 })
  }
}
