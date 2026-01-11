'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePermissions } from '@/hooks/use-permissions'
import { BackToDashboardButton} from '@/app/components/admin-button'
import { motion } from 'framer-motion'
import type { ActivityLog } from '@/lib/types'
import { History, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/ui/loading-spinner'

const activityTypeLabels: Record<string, string> = {
  application_created: 'Application Created',
  application_approved: 'Application Approved',
  application_denied: 'Application Denied',
  application_archived: 'Application Archived',
  application_note_added: 'Note Added',
  application_priority_changed: 'Priority Changed',
  application_assigned: 'Application Assigned',
  application_unassigned: 'Application Unassigned',
  user_banned: 'User Banned',
  user_unbanned: 'User Unbanned',
  user_blacklisted: 'User Blacklisted',
  user_unblacklisted: 'User Unblacklisted',
  application_exported: 'Applications Exported',
  bulk_action: 'Bulk Action',
}

export default function ActivityLogPage() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const fetchLogs = useCallback(async () => {
    try {
      const url = filter !== 'all' ? `/api/activity-log?type=${filter}` : '/api/activity-log'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (status === 'loading' || permissionsLoading) return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    const isReviewerOnly = permissions?.hasReviewerRole && !permissions?.hasAdminRole && !permissions?.hasModeratorRole
    if (!permissions?.hasAnyStaffRole || isReviewerOnly) {
      router.push('/')
    } else {
      fetchLogs()
    }
  }, [status, permissions, router, fetchLogs])

  if (status === 'loading' || loading || permissionsLoading) {
    return <LoadingPage text="Loading activity log..." />
  }

  if (!permissions?.hasAnyStaffRole) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-7xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Activity Log</h1>
          <p className="text-muted-foreground">Audit trail of all system actions</p>
        </div>
        <div className="flex gap-2">
          <BackToDashboardButton />
          
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            {Object.keys(activityTypeLabels).map(type => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                onClick={() => setFilter(type)}
                size="sm"
              >
                {activityTypeLabels[type]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity logs found</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-border/50 pb-4 last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activityTypeLabels[log.type] || log.type}</span>
                        <span className="text-sm text-muted-foreground">by {log.userName}</span>
                      </div>
                      {log.targetName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Target: {log.targetName}
                        </p>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
