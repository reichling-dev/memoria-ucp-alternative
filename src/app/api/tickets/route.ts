import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTicket, listTickets } from '@/lib/tickets'
import { notifyTicketCreated } from '@/lib/discord-bot'
import type { TicketCategory, TicketPriority } from '@/lib/types'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const tickets = await listTickets()
    return NextResponse.json(tickets)
  } catch {
    return NextResponse.json({ error: 'Failed to list tickets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const category: TicketCategory = body.category ?? 'other'
    const priority: TicketPriority = body.priority ?? 'normal'
    const subject: string = body.subject
    const description: string = body.description
    const attachments: string[] | undefined = body.attachments

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    const ticket = await createTicket({
      userId: session.user.email,
      userEmail: session.user.email,
      userName: (session as { discord?: { username?: string } })?.discord?.username ?? session.user.name ?? session.user.email,
      category,
      subject,
      description,
      priority,
      attachments,
      status: 'open',
    })

    // Send Discord notification
    notifyTicketCreated(ticket).catch(err => console.error('Ticket notification error:', err))

    // Log activity
    await logActivity({
      type: 'ticket_created',
      userId: ticket.userId,
      userName: ticket.userName,
      targetId: ticket.id,
      targetName: ticket.subject,
      details: { category: ticket.category, priority: ticket.priority }
    })

    // Create admin notification
    try {
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
        title: '🎫 New Support Ticket',
        message: `${ticket.userName} created a new ${ticket.priority} priority ticket: ${ticket.subject}`,
        ticketId: ticket.id,
        userId: ticket.userId,
        username: ticket.userName,
        priority: ticket.priority,
        timestamp: new Date().toISOString(),
        read: false
      })

      await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))
    } catch (error) {
      console.error('Failed to create admin notification:', error)
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Ticket create error:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
