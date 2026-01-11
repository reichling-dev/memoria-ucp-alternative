'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { motion } from 'framer-motion'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Bell, AlertTriangle, Clock, Check, CheckCheck, FileCheck, FileX, Archive } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'application_submitted' | 'application_approved' | 'application_denied' | 'application_archived' | 'system'
  title: string
  message: string
  applicationId?: string
  ticketId?: string
  userId?: string
  username?: string
  priority?: string
  reviewerName?: string
  timestamp: string
  read: boolean
}

interface StaleApplication {
  id: string
  username: string
  timestamp: string
  daysOld: number
}

export default function NotificationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [staleApplications, setStaleApplications] = useState<StaleApplication[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (permissionsLoading || status === 'loading') return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    if (!permissions?.hasAnyStaffRole) {
      router.push('/')
    } else {
      fetchNotifications()
      fetchStaleApplications()
    }
  }, [status, permissions, permissionsLoading, router])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchStaleApplications = async () => {
    try {
      const response = await fetch('/api/notifications/stale')
      if (response.ok) {
        const data = await response.json()
        setStaleApplications(data.stale || [])
      }
    } catch (error) {
      console.error('Error fetching stale applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast({ title: 'Success', description: 'All notifications marked as read' })
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'application_approved':
        return <FileCheck className="h-5 w-5 text-green-500" />
      case 'application_denied':
        return <FileX className="h-5 w-5 text-red-500" />
      case 'application_archived':
        return <Archive className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-muted/20 border-border'
    
    switch (type) {
      case 'application_submitted':
        return 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/30'
      case 'application_approved':
        return 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/30'
      case 'application_denied':
        return 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30'
      case 'application_archived':
        return 'bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/30'
      default:
        return 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30'
    }
  }

  if (status === 'loading' || loading || permissionsLoading) {
    return <LoadingPage text="Loading notifications..." />
  }

  if (!permissions?.hasAnyStaffRole) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-7xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <BackToDashboardButton />
          
        </div>
      </div>

      {/* Recent Notifications Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read 
                      ? 'bg-muted/20 border-border' 
                      : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                        {notification.priority && notification.priority !== 'normal' && (
                          <Badge 
                            className={
                              notification.priority === 'high' || notification.priority === 'urgent'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }
                          >
                            {notification.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(notification.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notification.username && (
                          <span>By: {notification.username}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.applicationId && (
                        <Link href="/admin/applications">
                          <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>
                            View
                          </Button>
                        </Link>
                      )}
                      {notification.ticketId && (
                        <Link href="/admin/tickets">
                          <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>
                            View Ticket
                          </Button>
                        </Link>
                      )}
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stale Applications Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Stale Applications ({staleApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Applications that have been pending for more than 7 days
          </p>
          {staleApplications.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No stale applications</p>
          ) : (
            <div className="space-y-3">
              {staleApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{app.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Pending for {app.daysOld} days
                      </p>
                    </div>
                  </div>
                  <Link href="/admin/applications">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email notifications are controlled by the EMAIL_ENABLED environment variable.
            Set EMAIL_ENABLED=true and configure your email service to enable email notifications.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
