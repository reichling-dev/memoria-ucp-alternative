import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import type { Application, ApplicationNote } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

async function getApplication(id: string): Promise<{ application: Application | null; isArchived: boolean }> {
  // Check active applications
  try {
    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications: Application[] = JSON.parse(data)
    const app = applications.find(a => a.id === id)
    if (app) return { application: app, isArchived: false }
  } catch {}

  // Check archived applications
  try {
    const data = await fs.readFile(archiveFilePath, 'utf8')
    const applications: Application[] = JSON.parse(data)
    const app = applications.find(a => a.id === id)
    if (app) return { application: app, isArchived: true }
  } catch {}

  return { application: null, isArchived: false }
}

async function updateApplication(id: string, updater: (app: Application) => Application, isArchived: boolean): Promise<void> {
  const filePath = isArchived ? archiveFilePath : dataFilePath
  const data = await fs.readFile(filePath, 'utf8')
  const applications: Application[] = JSON.parse(data)
  const index = applications.findIndex(a => a.id === id)
  
  if (index === -1) throw new Error('Application not found')
  
  applications[index] = updater(applications[index])
  await fs.writeFile(filePath, JSON.stringify(applications, null, 2))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const { application, isArchived } = await getApplication(id)
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const newNote: ApplicationNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      authorId: session.discord.id,
      authorName: session.discord.username,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    await updateApplication(id, (app) => ({
      ...app,
      notes: [...(app.notes || []), newNote],
    }), isArchived)

    await logActivity({
      type: 'application_note_added',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: id,
      targetName: application.username,
      details: { noteId: newNote.id },
    })

    return NextResponse.json({ note: newNote })
  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { application } = await getApplication(id)

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ notes: application.notes || [] })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}
