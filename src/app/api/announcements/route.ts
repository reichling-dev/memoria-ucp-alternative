import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const dataDir = path.join(process.cwd(), 'data')
const announcementsFilePath = path.join(dataDir, 'announcements.json')

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'maintenance' | 'event' | 'important' | 'update' | 'community'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt?: string
  createdBy: string
  createdById: string
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// GET - Fetch all announcements (public, no auth required)
export async function GET() {
  try {
    await ensureDataDir()

    try {
      const data = await fs.readFile(announcementsFilePath, 'utf8')
      const announcements: Announcement[] = JSON.parse(data)
      // Sort by creation date (newest first)
      const sorted = announcements.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      return NextResponse.json(sorted)
    } catch {
      // File doesn't exist, return empty array
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST - Create new announcement (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, type, priority } = body

    if (!title || !content || !type || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await ensureDataDir()

    let announcements: Announcement[] = []
    try {
      const data = await fs.readFile(announcementsFilePath, 'utf8')
      announcements = JSON.parse(data)
    } catch {
      // File doesn't exist, start with empty array
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      type,
      priority,
      createdAt: new Date().toISOString(),
      createdBy: session.discord.username,
      createdById: session.discord.id,
    }

    announcements.unshift(newAnnouncement) // Add to beginning
    await fs.writeFile(announcementsFilePath, JSON.stringify(announcements, null, 2))

    // Log activity
    await logActivity({
      type: 'announcement_created',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: newAnnouncement.id,
      targetName: newAnnouncement.title,
    })

    return NextResponse.json({ message: 'Announcement created successfully', announcement: newAnnouncement })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
