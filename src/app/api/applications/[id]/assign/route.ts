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
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { assignedTo } = await req.json()

    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications: Application[] = JSON.parse(data)
    const index = applications.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = applications[index]
    const oldAssignedTo = application.assignedTo

    applications[index] = {
      ...application,
      assignedTo: assignedTo || undefined,
    }

    await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))

    await logActivity({
      type: assignedTo ? 'application_assigned' : 'application_unassigned',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: id,
      targetName: application.username,
      details: { assignedTo: assignedTo || null, oldAssignedTo },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}
