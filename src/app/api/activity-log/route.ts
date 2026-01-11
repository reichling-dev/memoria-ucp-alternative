import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { getActivityLogs, getActivityLogsByType, getActivityLogsByTarget } from '@/lib/activity-log'

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
    const type = searchParams.get('type')
    const targetId = searchParams.get('targetId')
    const limit = parseInt(searchParams.get('limit') || '100')

    let logs
    if (type) {
      logs = await getActivityLogsByType(type as any, limit)
    } else if (targetId) {
      logs = await getActivityLogsByTarget(targetId, limit)
    } else {
      logs = await getActivityLogs(limit)
    }

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
