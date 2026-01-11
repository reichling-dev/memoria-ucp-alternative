import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import type { Announcement } from '../route'

const dataDir = path.join(process.cwd(), 'data')
const announcementsFilePath = path.join(dataDir, 'announcements.json')

async function ensureDataDir() {
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// PATCH - Update announcement (admin only)
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
    const body = await req.json()
    const { title, content, type, priority } = body

    await ensureDataDir()

    let announcements: Announcement[] = []
    try {
      const data = await fs.readFile(announcementsFilePath, 'utf8')
      announcements = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: 'Announcements file not found' }, { status: 404 })
    }

    const index = announcements.findIndex(ann => ann.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const updatedAnnouncement: Announcement = {
      ...announcements[index],
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(type && { type }),
      ...(priority && { priority }),
      updatedAt: new Date().toISOString(),
    }

    announcements[index] = updatedAnnouncement
    await fs.writeFile(announcementsFilePath, JSON.stringify(announcements, null, 2))

    // Log activity
    await logActivity({
      type: 'announcement_updated',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: id,
      targetName: updatedAnnouncement.title,
    })

    return NextResponse.json({ message: 'Announcement updated successfully', announcement: updatedAnnouncement })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE - Delete announcement (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await ensureDataDir()

    let announcements: Announcement[] = []
    try {
      const data = await fs.readFile(announcementsFilePath, 'utf8')
      announcements = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: 'Announcements file not found' }, { status: 404 })
    }

    const index = announcements.findIndex(ann => ann.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const deletedAnnouncement = announcements[index]
    announcements.splice(index, 1)
    await fs.writeFile(announcementsFilePath, JSON.stringify(announcements, null, 2))

    // Log activity
    await logActivity({
      type: 'announcement_deleted',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: id,
      targetName: deletedAnnouncement.title,
    })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
