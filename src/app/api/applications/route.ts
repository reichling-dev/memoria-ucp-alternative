import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { logActivity } from '@/lib/activity-log'
import { getUserRoles, sendChannelMessage } from '@/lib/discord-bot'
import { hasPriorityRole } from '@/lib/config'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const blacklistFilePath = path.join(process.cwd(), 'data', 'blacklist.json')
const bansFilePath = path.join(process.cwd(), 'data', 'bans.json')

interface BanEntry {
  discordId: string
  reason: string
  admin: string
  expires: string | null
}

interface BlacklistEntry {
  discordId: string
  reason: string
  admin: string
  date: string
}

async function isUserBanned(discordId: string): Promise<boolean> {
  try {
    const bansData = await fs.readFile(bansFilePath, 'utf8')
    const bans: BanEntry[] = JSON.parse(bansData)
    return bans.some(ban => ban.discordId === discordId)
  } catch {
    return false
  }
}

async function isUserBlacklisted(discordId: string): Promise<boolean> {
  try {
    const blacklistData = await fs.readFile(blacklistFilePath, 'utf8')
    const blacklist: BlacklistEntry[] = JSON.parse(blacklistData)
    return blacklist.some(entry => entry.discordId === discordId)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const application = await req.json()
    const applicationType: string = application.applicationType || 'whitelist'

    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
    if (application.discord?.id) {
      try {
        const roles = await getUserRoles(application.discord.id)
        // Check if user has any priority role from config
        if (hasPriorityRole(roles)) {
          priority = 'high'
        }
      } catch (error) {
        console.error('Error getting user roles:', error)
      }
    }

    // Check if user is banned
    if (application.discord?.id) {
      const banned = await isUserBanned(application.discord.id)
      if (banned) {
        return NextResponse.json({ error: 'You are banned' }, { status: 403 })
      }

      const blacklisted = await isUserBlacklisted(application.discord.id)
      if (blacklisted) {
        return NextResponse.json({ error: 'You are blacklisted' }, { status: 403 })
      }
    }

    let applications = []
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {
    }

    // Enforce per-type rules
    const typesFilePath = path.join(process.cwd(), 'data', 'application-types.json')
    let typeConfig: { cooldownDays: number; uniqueApproved: boolean; allowMultiplePending: boolean } = { cooldownDays: 0, uniqueApproved: false, allowMultiplePending: false }
    try {
      const tRaw = await fs.readFile(typesFilePath, 'utf8')
      const list = JSON.parse(tRaw)
      const found = Array.isArray(list) ? list.find((t: any) => t.id === applicationType) : null
      if (found) typeConfig = { cooldownDays: found.cooldownDays || 0, uniqueApproved: !!found.uniqueApproved, allowMultiplePending: !!found.allowMultiplePending }
    } catch {}

    const userId = application.discord?.id
    if (userId) {
      const sameTypeCurrent = (applications || []).filter((a: any) => a.discord?.id === userId && ((a.applicationType || 'whitelist') === applicationType))
      if (!typeConfig.allowMultiplePending) {
        if (sameTypeCurrent.some((a: any) => (a.status || 'pending') === 'pending')) {
          return NextResponse.json({ error: 'You already have a pending application of this type' }, { status: 400 })
        }
      }

      if (typeConfig.uniqueApproved) {
        try {
          const archivedRaw = await fs.readFile(path.join(process.cwd(), 'data', 'archived_applications.json'), 'utf8')
          const archived = JSON.parse(archivedRaw)
          if (Array.isArray(archived)) {
            const approved = archived.find((a: any) => a.discord?.id === userId && ((a.applicationType || 'whitelist') === applicationType) && a.status === 'approved')
            if (approved) {
              return NextResponse.json({ error: 'You are already approved for this application type' }, { status: 400 })
            }
            if (typeConfig.cooldownDays > 0) {
              const deniedList = archived.filter((a: any) => a.discord?.id === userId && ((a.applicationType || 'whitelist') === applicationType) && a.status === 'denied')
              if (deniedList.length > 0) {
                deniedList.sort((a: any, b: any) => new Date(b.updatedAt || b.timestamp).getTime() - new Date(a.updatedAt || a.timestamp).getTime())
                const lastDenied = deniedList[0]
                const since = new Date(lastDenied.updatedAt || lastDenied.timestamp)
                const until = new Date(since)
                until.setDate(until.getDate() + typeConfig.cooldownDays)
                if (new Date() < until) {
                  const daysRemaining = Math.max(0, Math.ceil((until.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  return NextResponse.json({ error: `Please wait ${daysRemaining} day(s) before applying again for this type` }, { status: 400 })
                }
              }
            }
          }
        } catch {}
      }
    }

    const newApplication = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
      priority,
      applicationType: applicationType,
      ...application
    }
    applications.push(newApplication)

    await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))

    // Create notification for admins
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'application_submitted',
          title: 'New Application Submitted',
          message: `${application.username || application.discord.username} has submitted a ${applicationType} application`,
          applicationId: newApplication.id,
          userId: application.discord.id,
          username: application.discord.username,
          priority: priority,
        })
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
    }

    // Send notification to Discord channel
    try {
      await sendChannelMessage(`New whitelist application submitted by ${application.username} (${application.discord.username}) - Priority: ${priority}`)
    } catch (error) {
      console.error('Failed to send Discord notification:', error)
    }

    // Log activity
    if (application.discord?.id) {
      await logActivity({
        type: 'application_created',
        userId: application.discord.id,
        userName: application.discord.username,
        targetId: newApplication.id,
        targetName: application.username || application.discord.username,
      })
    }

    return NextResponse.json({ message: 'Application submitted successfully', id: newApplication.id })
  } catch (error) {
    console.error('Error saving application:', error)
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications = JSON.parse(data)
    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error reading applications:', error)
    return NextResponse.json({ error: 'Failed to read applications' }, { status: 500 })
  }
}

