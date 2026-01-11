import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasPermission } from "@/lib/auth"
import { getUserRoles } from '@/lib/discord-bot'
import { logActivity } from '@/lib/activity-log'

const blacklistFilePath = path.join(process.cwd(), 'data', 'blacklist.json')
const bansFilePath = path.join(process.cwd(), 'data', 'bans.json')

type BlacklistEntry = {
  discordId: string
  reason: string
  admin: string
  date: string
}

type BanEntry = {
  discordId: string
  reason: string
  admin: string
  expires: string | null
}

// GET - Get all banned/blacklisted users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = await getUserRoles(session.discord.id)
    if (!hasPermission(userRoles, 'canManageBans')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read blacklist and bans
    let blacklist = []
    let bans = []

    try {
      const blacklistData = await fs.readFile(blacklistFilePath, 'utf8')
      blacklist = JSON.parse(blacklistData)
    } catch {
      // File doesn't exist or is empty
    }

    try {
      const bansData = await fs.readFile(bansFilePath, 'utf8')
      bans = JSON.parse(bansData)
    } catch {
      // File doesn't exist or is empty
    }

    return NextResponse.json({
      blacklist,
      bans
    })
  } catch (error) {
    console.error('Error fetching user management data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST - Add user to blacklist or ban
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = await getUserRoles(session.discord.id)
    if (!hasPermission(userRoles, 'canManageBans')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, discordId, reason, admin, expires } = await req.json()

    if (!discordId || !reason || !admin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'blacklist') {
      // Add to blacklist
      let blacklist = []
      try {
        const data = await fs.readFile(blacklistFilePath, 'utf8')
        blacklist = JSON.parse(data)
      } catch {
        // File doesn't exist, start with empty array
      }

      // Check if already blacklisted
      if (blacklist.find((u: BlacklistEntry) => u.discordId === discordId)) {
        return NextResponse.json({ error: 'User is already blacklisted' }, { status: 400 })
      }

      const blacklistEntry = {
        discordId,
        reason,
        admin,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      }

      blacklist.push(blacklistEntry)
      await fs.writeFile(blacklistFilePath, JSON.stringify(blacklist, null, 2))

      await logActivity({
        type: 'user_blacklisted',
        userId: session.discord.id,
        userName: session.discord.username ?? session.user.name ?? 'Unknown',
        targetId: discordId,
        targetName: discordId,
        details: { reason }
      })

      return NextResponse.json({ message: 'User blacklisted successfully', entry: blacklistEntry })

    } else if (action === 'ban') {
      // Add to bans
      let bans = []
      try {
        const data = await fs.readFile(bansFilePath, 'utf8')
        bans = JSON.parse(data)
      } catch {
        // File doesn't exist, start with empty array
      }

      // Check if already banned
      if (bans.find((u: BanEntry) => u.discordId === discordId)) {
        return NextResponse.json({ error: 'User is already banned' }, { status: 400 })
      }

      const banEntry = {
        discordId,
        reason,
        admin,
        expires: expires || null
      }

      bans.push(banEntry)
      await fs.writeFile(bansFilePath, JSON.stringify(bans, null, 2))

      await logActivity({
        type: 'user_banned',
        userId: session.discord.id,
        userName: session.discord.username ?? session.user.name ?? 'Unknown',
        targetId: discordId,
        targetName: discordId,
        details: { reason, expires }
      })

      return NextResponse.json({ message: 'User banned successfully', entry: banEntry })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in user management:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// DELETE - Remove user from blacklist or ban
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = await getUserRoles(session.discord.id)
    if (!hasPermission(userRoles, 'canManageBans')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, discordId } = await req.json()

    if (!discordId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'unblacklist') {
      // Remove from blacklist
      let blacklist = []
      try {
        const data = await fs.readFile(blacklistFilePath, 'utf8')
        blacklist = JSON.parse(data)
      } catch {
        return NextResponse.json({ error: 'Blacklist not found' }, { status: 404 })
      }

      const filteredBlacklist = blacklist.filter((u: BlacklistEntry) => u.discordId !== discordId)

      if (filteredBlacklist.length === blacklist.length) {
        return NextResponse.json({ error: 'User not found in blacklist' }, { status: 404 })
      }

      await fs.writeFile(blacklistFilePath, JSON.stringify(filteredBlacklist, null, 2))

      await logActivity({
        type: 'user_unblacklisted',
        userId: session.discord.id,
        userName: session.discord.username ?? session.user.name ?? 'Unknown',
        targetId: discordId,
        targetName: discordId
      })

      return NextResponse.json({ message: 'User removed from blacklist successfully' })

    } else if (action === 'unban') {
      // Remove from bans
      let bans = []
      try {
        const data = await fs.readFile(bansFilePath, 'utf8')
        bans = JSON.parse(data)
      } catch {
        return NextResponse.json({ error: 'Bans not found' }, { status: 404 })
      }

      const filteredBans = bans.filter((u: BanEntry) => u.discordId !== discordId)

      if (filteredBans.length === bans.length) {
        return NextResponse.json({ error: 'User not found in bans' }, { status: 404 })
      }

      await fs.writeFile(bansFilePath, JSON.stringify(filteredBans, null, 2))

      await logActivity({
        type: 'user_unbanned',
        userId: session.discord.id,
        userName: session.discord.username ?? session.user.name ?? 'Unknown',
        targetId: discordId,
        targetName: discordId
      })

      return NextResponse.json({ message: 'User unbanned successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in user management:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}