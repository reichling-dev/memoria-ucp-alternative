import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/config'
import { getUserRoles } from '@/lib/discord-bot'
import { logActivity } from '@/lib/activity-log'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const discordId = (session as any)?.discord?.id
    
    if (!discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Discord roles
    let userRoles: string[] = []
    try {
      userRoles = await getUserRoles(discordId)
    } catch (error) {
      console.error('Error fetching user roles:', error)
    }

    // Check if user has permission to manage rules
    if (!hasPermission(discordId, userRoles, 'canManageRules')) {
      return NextResponse.json({ 
        error: 'Forbidden - You need admin role to manage rules' 
      }, { status: 403 })
    }

    const body = await req.json()
    const filePath = path.join(process.cwd(), 'data', 'rules.json')
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8')

    await logActivity({
      type: 'rules_updated',
      userId: discordId,
      userName: (session as any)?.discord?.username ?? session?.user?.name ?? 'Unknown',
      details: { 
        categoriesCount: body.categories?.length ?? 0,
        totalRules: body.categories?.reduce((sum: number, cat: any) => sum + (cat.rules?.length ?? 0), 0) ?? 0
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
