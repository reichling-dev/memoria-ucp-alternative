'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import type { Application } from '@/lib/types'

interface ApplicationStats {
  total: number
  pending: number
  approved: number
  denied: number
  approvalRate: number
  averageWaitTime: number
}

export function ApplicationStatistics({ applications }: { applications: Application[] }) {
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    approvalRate: 0,
    averageWaitTime: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || applications.length === 0) return

    const pending = applications.filter(app => app.status === 'pending').length
    const approved = applications.filter(app => app.status === 'approved').length
    const denied = applications.filter(app => app.status === 'denied').length
    const total = applications.length

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    // Calculate average wait time in days
    const reviewedApps = applications.filter(app => app.reviewedAt)
    let averageWaitTime = 0
    if (reviewedApps.length > 0) {
      const totalWaitTime = reviewedApps.reduce((sum, app) => {
        const submitted = new Date(app.timestamp).getTime()
        const reviewed = new Date(app.reviewedAt!).getTime()
        return sum + (reviewed - submitted)
      }, 0)
      averageWaitTime = Math.round(totalWaitTime / reviewedApps.length / (1000 * 60 * 60 * 24))
    }

    setStats({
      total,
      pending,
      approved,
      denied,
      approvalRate,
      averageWaitTime,
    })
  }, [applications, mounted])

  const statItems = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Denied',
      value: stats.denied,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ]

  // Don't render until client-side is mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={item.bgColor} >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${item.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-4 md:col-span-2"
      >
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvalRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">of applications approved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.averageWaitTime}d</p>
              <p className="text-xs text-muted-foreground mt-1">days for review</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
