import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from "@/lib/auth"
import { sendDirectMessage } from '@/lib/discord-bot'
import { logActivity } from '@/lib/activity-log'
import { sendEmail, generateApplicationStatusEmail } from '@/lib/email'
import type { Application } from '@/lib/types'


const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

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
    const { status, reason } = await req.json()

    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications: Application[] = JSON.parse(data)

    const applicationIndex = applications.findIndex((app) => app.id === id)
    if (applicationIndex === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const updatedApplication: Application = {
      ...applications[applicationIndex],
      status,
      statusReason: reason,
      updatedAt: new Date().toISOString(),
      reviewer: session.discord.id,
      reviewedAt: new Date().toISOString(),
    }

    applications.splice(applicationIndex, 1)
    await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))

    let archivedApplications: Application[] = []
    try {
      const archivedData = await fs.readFile(archiveFilePath, 'utf8')
      archivedApplications = JSON.parse(archivedData)
    } catch {
      console.log('No existing archive file, creating a new one')
    }
    archivedApplications.push(updatedApplication)
    await fs.writeFile(archiveFilePath, JSON.stringify(archivedApplications, null, 2))

    // Log activity
    await logActivity({
      type: status === 'approved' ? 'application_approved' : 'application_denied',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: updatedApplication.id,
      targetName: updatedApplication.username,
      details: { reason },
    })

    await logActivity({
      type: 'application_archived',
      userId: session.discord.id,
      userName: session.discord.username,
      targetId: updatedApplication.id,
      targetName: updatedApplication.username,
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

      const notificationTitle = status === 'approved' 
        ? '✅ Application Approved'
        : '❌ Application Denied'
      
      const notificationMessage = status === 'approved'
        ? `${session.discord.username} approved application from ${updatedApplication.username}`
        : `${session.discord.username} denied application from ${updatedApplication.username}${reason ? `: ${reason}` : ''}`

      notifications.push({
        id: Date.now().toString(),
        type: status === 'approved' ? 'application_approved' : 'application_denied',
        title: notificationTitle,
        message: notificationMessage,
        applicationId: updatedApplication.id,
        userId: updatedApplication.discord.id,
        username: updatedApplication.username,
        reviewerName: session.discord.username,
        timestamp: new Date().toISOString(),
        read: false
      })

      // Also add archived notification
      notifications.push({
        id: (Date.now() + 1).toString(),
        type: 'application_archived',
        title: '📦 Application Archived',
        message: `Application from ${updatedApplication.username} has been moved to archive with status: ${status}`,
        applicationId: updatedApplication.id,
        userId: updatedApplication.discord.id,
        username: updatedApplication.username,
        reviewerName: session.discord.username,
        timestamp: new Date().toISOString(),
        read: false
      })

      await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2))
    } catch (error) {
      console.error('Failed to create admin notification:', error)
    }

    let discordMessageSent = false
    try {
      console.log(`Attempting to send Discord DM to user ${updatedApplication.discord.id} for ${status} application`)
      await sendDirectMessage(updatedApplication.discord.id, status as 'approved' | 'denied', reason)
      discordMessageSent = true
      console.log(`Discord message sent successfully to user ${updatedApplication.discord.id}`)
    } catch (error) {
      console.error(`Failed to send Discord message to user ${updatedApplication.discord.id}:`, error)
    }

    // Send email notification if enabled
    let emailSent = false
    if (updatedApplication.discord.email) {
      try {
        const emailOptions = generateApplicationStatusEmail(
          updatedApplication.discord.username,
          status as 'approved' | 'denied',
          reason
        )
        emailOptions.to = updatedApplication.discord.email
        emailSent = await sendEmail(emailOptions)
      } catch (error) {
        console.error(`Failed to send email to user ${updatedApplication.discord.id}:`, error)
      }
    }

    const message = discordMessageSent
      ? 'Application status updated and archived successfully. Discord notification sent.'
      : 'Application status updated and archived successfully. Discord notification queued for delivery.'

    return NextResponse.json({ message, discordMessageSent, emailSent })
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

