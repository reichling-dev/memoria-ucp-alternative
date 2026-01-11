'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePermissions } from '@/hooks/use-permissions'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { motion } from 'framer-motion'
import { LoadingPage } from '@/components/ui/loading-spinner'
import type { ApplicationStats } from '@/lib/types'
import { BarChart3, TrendingUp, Clock, FileText } from 'lucide-react'

export default function AnalyticsDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)

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
      fetchStats()
    }
  }, [status, permissions, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/applications/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || permissionsLoading) {
    return <LoadingPage text="Loading analytics..." />
  }

  if (!permissions?.hasAnyStaffRole || !stats) {
    return null
  }

  const maxDayCount = Math.max(...stats.byDay.map(d => d.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-7xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Application statistics and insights</p>
        </div>
        <div className="flex gap-2">
          <BackToDashboardButton />
        
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.approvalRate.toFixed(1)}% approval rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.denied}</div>
            <p className="text-xs text-muted-foreground mt-1">Rejected applications</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Applications Over Time (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byDay.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${(day.count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm font-medium">{day.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Low</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-4">
                    <div className="bg-gray-500 h-full rounded-full" style={{ width: `${(stats.byPriority.low / Math.max(stats.pending, 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.byPriority.low}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Normal</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-4">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(stats.byPriority.normal / Math.max(stats.pending, 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.byPriority.normal}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-4">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(stats.byPriority.high / Math.max(stats.pending, 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.byPriority.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Urgent</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-4">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.byPriority.urgent / Math.max(stats.pending, 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.byPriority.urgent}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Review Time</p>
              <p className="text-2xl font-bold">{stats.averageReviewTime.toFixed(1)} hours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
              <p className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        {stats.byAdmin.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reviews by Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.byAdmin.map((admin, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{admin.adminName}</span>
                    <span className="text-sm font-medium">{admin.count} reviews</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  )
}
