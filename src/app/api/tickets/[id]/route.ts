import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addTicketNote, deleteTicket, getTicket, updateTicket } from '@/lib/tickets'
import { notifyTicketStatusChanged } from '@/lib/discord-bot'
import { logActivity } from '@/lib/activity-log'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ticket = await getTicket(id)
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed to get ticket' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const allowedFields = ['status', 'priority', 'assignedTo', 'assignedToName'] as const
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key]
    }

    const oldTicket = await getTicket(id)
    const updated = await updateTicket(id, updates)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Notify on status change
    if (oldTicket && 'status' in updates && oldTicket.status !== updates.status) {
      notifyTicketStatusChanged(updated, oldTicket.status).catch(err => console.error('Status notification error:', err))
    }

    // Log activity
    await logActivity({
      type: 'ticket_updated',
      userId: (session as any).discord?.id ?? session.user?.email ?? 'unknown',
      userName: (session as any).discord?.username ?? session.user?.name ?? 'Unknown',
      targetId: id,
      targetName: updated.subject,
      details: updates
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const ticket = await getTicket(id)
    const ok = await deleteTicket(id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await logActivity({
      type: 'ticket_deleted',
      userId: (session as any).discord?.id ?? session.user?.email ?? 'unknown',
      userName: (session as any).discord?.username ?? session.user?.name ?? 'Unknown',
      targetId: id,
      targetName: ticket?.subject ?? id
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Add note to ticket
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params
    const body = await req.json()
    const content: string = body.content
    if (!content) return NextResponse.json({ error: 'Note content required' }, { status: 400 })

    const ticket = await addTicketNote(id, {
      authorId: (session as { discord?: { id?: string }; user?: { email?: string } })?.discord?.id ?? session.user?.email ?? 'unknown',
      authorName: (session as { discord?: { username?: string }; user?: { name?: string } })?.discord?.username ?? session.user?.name ?? 'Unknown',
      content,
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await logActivity({
      type: 'ticket_note_added',
      userId: (session as { discord?: { id?: string }; user?: { email?: string } })?.discord?.id ?? session.user?.email ?? 'unknown',
      userName: (session as { discord?: { username?: string }; user?: { name?: string } })?.discord?.username ?? session.user?.name ?? 'Unknown',
      targetId: id,
      targetName: ticket.subject,
      details: { noteLength: content.length }
    })

    // Send notification to ticket creator if admin/staff replied
    try {
      const { getUserRoles } = await import('@/lib/discord-bot')
      const { hasAnyStaffRole } = await import('@/lib/config')
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const discordId = (session as { discord?: { id?: string } })?.discord?.id
      if (discordId) {
        const userRoles = await getUserRoles(discordId)
        const isStaff = hasAnyStaffRole(userRoles)
        
        // Only notify user if a staff member replied
        if (isStaff && ticket.userId !== discordId) {
          const notificationsFilePath = path.join(process.cwd(), 'data', 'notifications.json')
          let notifications: any[] = []
          try {
            const notifData = await fs.readFile(notificationsFilePath, 'utf8')
            notifications = JSON.parse(notifData)
          } catch {
            notifications = []
          }

          notifications.push({
            id: Date.now().toString(),
            type: 'system',
            title: '💬 Ticket Reply',
            message: `Staff member ${(session as { discord?: { username?: string } })?.discord?.username ?? session.user?.name} replied to your ticket: ${ticket.subject}`,
            ticketId: ticket.id,
            userId: ticket.userId,
            username: ticket.userName,
            timestamp: new Date().toISOString(),
            read: false,
            isUserNotification: true
          })

          await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))
        }
      }
    } catch (error) {
      console.error('Failed to create user notification:', error)
    }

    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
