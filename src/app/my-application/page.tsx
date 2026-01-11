'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import type { Application } from '@/lib/types'
import { FileText, CheckCircle2, XCircle, Clock, Calendar, User, Zap, Eye, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { HomeButton } from '@/app/components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { ApplicationStatistics } from '@/components/application-statistics'

const statusConfig = {
  pending: { label: 'Pending Review', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', dotColor: 'bg-yellow-500' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', dotColor: 'bg-green-500' },
  denied: { label: 'Denied', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', dotColor: 'bg-red-500' },
}

export default function MyApplicationPage() {
  const { status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [latestApplication, setLatestApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'latest' | 'history'>('latest')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchMyApplications()
    }
  }, [status, router])

  const fetchMyApplications = async () => {
    try {
      const response = await fetch('/api/applications/my-status')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setLatestApplication(data.latestApplication)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading || !mounted) {
    return <LoadingPage text="Loading your applications..." />
  }

  if (status === 'unauthenticated') {
    return null
  }

  const StatusIcon = latestApplication?.status ? statusConfig[latestApplication.status].icon : Clock
  const statusLabel = latestApplication?.status ? statusConfig[latestApplication.status].label : 'No Application'
  const statusColor = latestApplication?.status ? statusConfig[latestApplication.status].color : 'text-muted-foreground'
  const statusBgColor = latestApplication?.status ? statusConfig[latestApplication.status].bgColor : 'bg-muted'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-6xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your whitelist applications</p>
        </div>
        <HomeButton />
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'latest' ? 'default' : 'outline'}
          onClick={() => setViewMode('latest')}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Latest Application
        </Button>
        <Button
          variant={viewMode === 'history' ? 'default' : 'outline'}
          onClick={() => setViewMode('history')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Full History ({applications.length})
        </Button>
      </div>

      {/* Statistics */}
      {applications.length > 0 && <ApplicationStatistics applications={applications} />}

      <AnimatePresence mode="wait">
        {viewMode === 'latest' ? (
          <motion.div
            key="latest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {latestApplication ? (
              <ApplicationDetailCard application={latestApplication} />
            ) : (
              <EmptyApplicationCard />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app, index) => (
                  <ApplicationHistoryItem
                    key={app.id}
                    application={app}
                    isExpanded={expandedId === app.id}
                    onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    isLatest={index === 0}
                  />
                ))}
              </div>
            ) : (
              <EmptyApplicationCard />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Application Detail Card Component
function ApplicationDetailCard({ application }: { application: Application }) {
  const StatusIcon = application.status ? statusConfig[application.status].icon : Clock
  const statusLabel = application.status ? statusConfig[application.status].label : 'No Status'
  const statusColor = application.status ? statusConfig[application.status].color : 'text-muted-foreground'
  const statusBgColor = application.status ? statusConfig[application.status].bgColor : 'bg-muted'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Status Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Current Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className={`${statusBgColor} p-6 rounded-lg border-2 border-current/10`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusBgColor} border-2 border-current/20`}>
                <StatusIcon className={`h-8 w-8 ${statusColor}`} />
              </div>
              <div>
                <p className={`font-bold text-lg ${statusColor}`}>{statusLabel}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted {formatDate(application.timestamp)}
                </p>
                {application.reviewedAt && (
                  <p className="text-sm text-muted-foreground">
                    Reviewed {formatDate(application.reviewedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Reviewer Notes */}
            {application.statusReason && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-background rounded-lg border border-border"
              >
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reviewer Feedback:
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {application.statusReason}
                </p>
              </motion.div>
            )}
          </div>

          {/* Application Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Character Name */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Character Name</p>
              <p className="font-bold text-lg mt-2">{application.characterName || application.username}</p>
            </div>

            {/* Age */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Age</p>
              <p className="font-bold text-lg mt-2">{application.age} years</p>
            </div>

            {/* Priority */}
            {application.priority && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</p>
                <Badge className="mt-2 capitalize">{application.priority}</Badge>
              </div>
            )}

            {/* Steam ID */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border col-span-1 md:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Steam ID</p>
              <p className="font-mono text-sm mt-2 break-all">{application.steamId}</p>
            </div>

            {/* Assigned To */}
            {application.assignedTo && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned To</p>
                <p className="font-medium mt-2">{application.assignedTo}</p>
              </div>
            )}
          </div>

          {/* CFX Account */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">CFX Forum Account</p>
            <a
              href={application.cfxAccount}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all font-medium"
            >
              {application.cfxAccount}
            </a>
          </div>

          {/* Experience */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">RP Experience</p>
            <p className="text-sm text-foreground leading-relaxed">{application.experience}</p>
          </div>

          {/* Character Backstory */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Character Backstory</p>
            <p className="text-sm text-foreground leading-relaxed">{application.character}</p>
          </div>

          {/* Notes Section */}
          {application.notes && application.notes.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Admin Notes ({application.notes.length})</p>
              <div className="space-y-3">
                {application.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-background rounded border border-border/50">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{note.authorName}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(note.timestamp)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            Back to Home
          </Button>
        </Link>
        <Link href="/apply" className="flex-1">
          <Button className="w-full">Submit New Application</Button>
        </Link>
      </div>
    </motion.div>
  )
}

// Application History Item Component
function ApplicationHistoryItem({
  application,
  isExpanded,
  onToggle,
  isLatest,
}: {
  application: Application
  isExpanded: boolean
  onToggle: () => void
  isLatest: boolean
}) {
  const StatusIcon = application.status ? statusConfig[application.status].icon : Clock
  const statusLabel = application.status ? statusConfig[application.status].label : 'Pending'
  const statusColor = application.status ? statusConfig[application.status].color : 'text-muted-foreground'
  const dotColor = application.status ? statusConfig[application.status].dotColor : 'bg-gray-500'

  return (
    <motion.div
      layout
      className={`border-2 rounded-lg overflow-hidden transition-all ${
        isLatest ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          {/* Timeline Dot */}
          <div className="relative flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${dotColor} flex-shrink-0`} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
              <p className="font-semibold">{statusLabel}</p>
              {isLatest && <Badge variant="default" className="text-xs">Latest</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(application.timestamp)}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-right">
            {application.priority && (
              <Badge variant="outline" className="capitalize">
                <Zap className="h-3 w-3 mr-1" />
                {application.priority}
              </Badge>
            )}
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-muted/30 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Character Name</p>
                <p className="font-medium mt-1">{application.characterName || application.username}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Age</p>
                <p className="font-medium mt-1">{application.age} years</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Steam ID</p>
                <p className="font-mono text-xs mt-1 break-all">{application.steamId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">CFX Account</p>
                <a
                  href={application.cfxAccount}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs break-all mt-1"
                >
                  View
                </a>
              </div>
            </div>

            {application.statusReason && (
              <div className="mt-4 p-3 bg-background rounded border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Feedback</p>
                <p className="text-sm">{application.statusReason}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Empty Applications Card
function EmptyApplicationCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="p-4 rounded-full bg-muted mb-4"
        >
          <FileText className="w-8 h-8 text-muted-foreground" />
        </motion.div>
        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          You haven't submitted any applications yet. Start your journey by submitting one today!
        </p>
        <Link href="/apply">
          <Button>Submit Your First Application</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Utility function to format dates - use consistent UTC formatting
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    })
  } catch {
    return dateString
  }
}
