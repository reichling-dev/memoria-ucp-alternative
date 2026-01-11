'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import ProfileCard from '@/app/components/profile-card'
import { motion, AnimatePresence } from 'framer-motion'
import { usePermissions } from '@/hooks/use-permissions'
import { Download, MoreVertical, Flag, MessageSquare, X } from 'lucide-react'
import { BackToDashboardButton} from '@/app/components/admin-button'
import { ApplicationFiltersPanel } from '@/components/application-filters'
import { ApplicationNotesPanel } from '@/components/application-notes-panel'
import type { Application, ApplicationFilters } from '@/lib/types'
import { LoadingPage } from '@/components/ui/loading-spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

type DiscordUser = {
  id: string
  username: string
  discriminator: string
  avatar: string
  banner: string
  accentColor: number | null
  verified: boolean
  email: string
  createdAt: string
}

interface ExtendedSession extends Session {
  discord: DiscordUser
}

const priorityColors = {
  low: 'bg-gray-500',
  normal: 'bg-blue-500',
  high: 'bg-red-500',
  urgent: 'bg-red-600',
}

const priorityLabels = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export default function AdminApplications() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [applicationScores, setApplicationScores] = useState<Record<string, { overallScore: number, criteria: { experienceQuality: number, characterDepth: number, completeness: number, length: number } }>>({})
  const [filters, setFilters] = useState<ApplicationFilters>({})
  const [reason, setReason] = useState('')
  const [selectedAppForNotes, setSelectedAppForNotes] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchApplications = useCallback(async () => {
    try {
      if (Object.keys(filters).length > 0 && (filters.search || filters.status || filters.priority)) {
        const response = await fetch('/api/applications/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        })
        if (response.ok) {
          const data = await response.json()
          const sortedData = [...data].sort((a, b) => {
            const order = { urgent: 4, high: 3, normal: 2, low: 1 }
            return (order[b.priority as keyof typeof order] || 2) - (order[a.priority as keyof typeof order] || 2)
          })
          setFilteredApplications(sortedData)
          // Fetch scores for all applications
          await fetchScoresForApplications(sortedData)
          return
        }
      }
      
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        const sortedData = [...data].sort((a, b) => {
          const order = { urgent: 4, high: 3, normal: 2, low: 1 }
          return (order[b.priority as keyof typeof order] || 2) - (order[a.priority as keyof typeof order] || 2)
        })
        setFilteredApplications(sortedData)
        // Fetch scores for all applications
        await fetchScoresForApplications(sortedData)
      } else {
        throw new Error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch applications. Please try again.',
        variant: 'destructive',
      })
    }
  }, [filters, toast])

  const fetchScoresForApplications = async (apps: Application[]) => {
    const scores: Record<string, { overallScore: number, criteria: { experienceQuality: number, characterDepth: number, completeness: number, length: number } }> = {}
    for (const app of apps) {
      try {
        const response = await fetch(`/api/applications/score?id=${app.id}`)
        if (response.ok) {
          const data = await response.json()
          scores[app.id] = data
        }
      } catch {
        console.error(`Failed to fetch score for ${app.id}`)
      }
    }
    setApplicationScores(scores)
  }

  useEffect(() => {
    // Don't redirect while permissions are loading or session is loading
    if (permissionsLoading || status === 'loading') {
      return
    }
    
    // Wait for authenticated session
    if (status !== 'authenticated') {
      router.push('/')
      return
    }

    // Wait for permissions to load (check if roles array exists and has data or hasAnyStaffRole is set)
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) {
      return
    }
    
    if (!permissions?.hasAnyStaffRole) {
      router.push('/')
    } else {
      fetchApplications()
    }
  }, [status, permissions, permissionsLoading, router, fetchApplications])

  const handleSearch = () => {
    fetchApplications()
  }

  const handleClearFilters = () => {
    setFilters({})
    fetchApplications()
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'denied') => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application status')
      }

      const data = await response.json()
      toast({
        title: newStatus === 'approved' ? 'Application Approved' : 'Application Denied',
        description: data.discordMessageSent
          ? `The application has been ${newStatus} and moved to the archive. The applicant has been notified via Discord.`
          : `The application has been ${newStatus} and moved to the archive. Discord notification has been queued for delivery.`,
      })
      fetchApplications()
      setReason('')
      setSelectedApplications(new Set())

      if (newStatus === 'approved') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#ffffff', '#e5e5e5', '#d4d4d4'],
          ticks: 200,
          gravity: 0.8,
          scalar: 0.8
        })
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: 'Update Error',
        description: error instanceof Error ? error.message : 'There was an error updating the application status.',
        variant: 'destructive',
      })
    }
  }

  const handlePriorityChange = async (applicationId: string, priority: 'low' | 'normal' | 'high' | 'urgent') => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      if (response.ok) {
        fetchApplications()
        toast({ title: 'Priority Updated', description: 'Application priority has been updated.' })
      }
      
    } catch {
      
      toast({ title: 'Error', description: 'Failed to update priority.', variant: 'destructive' })
    }
  }

  const handleAssign = async (applicationId: string, assignedTo: string | null) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      })

      if (response.ok) {
        fetchApplications()
        toast({ title: 'Assignment Updated', description: 'Application assignment has been updated.' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update assignment.', variant: 'destructive' })
    }
  }

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedApplications.size === 0) {
      toast({ title: 'No Selection', description: 'Please select at least one application.', variant: 'destructive' })
      return
    }

    try {
      const response = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          applicationIds: Array.from(selectedApplications),
          ...(value && { [action === 'assign' ? 'assignedTo' : 'priority']: value }),
        }),
      })

      if (response.ok) {
        fetchApplications()
        setSelectedApplications(new Set())
        toast({ title: 'Bulk Action Completed', description: `Bulk ${action} completed successfully.` })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to perform bulk action.', variant: 'destructive' })
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const ids = selectedApplications.size > 0 ? Array.from(selectedApplications) : undefined
      const url = `/api/applications/export?format=${format}${ids ? `&ids=${ids.join(',')}` : ''}`
      
      const response = await fetch(url)
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `applications-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        
        toast({ title: 'Export Successful', description: `Applications exported as ${format.toUpperCase()}.` })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to export applications.', variant: 'destructive' })
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedApplications(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)))
    }
  }

  if (permissionsLoading || !(session as ExtendedSession)?.discord) {
    return <LoadingPage text="Loading applications..." />
  }

  if (!permissions?.hasAnyStaffRole) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Applications</h1>
          <p className="text-muted-foreground">Review and manage whitelist applications</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/archive">
            <Button variant="outline" size="sm">Archive</Button>
          </Link>
          <BackToDashboardButton />
          
        </div>
      </div>

      <ApplicationFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        onClear={handleClearFilters}
      />

      {selectedApplications.size > 0 && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">{selectedApplications.size} selected</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Flag className="h-4 w-4 mr-2" />
                      Set Priority
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('priority', 'low')}>Low</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('priority', 'normal')}>Normal</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('priority', 'high')}>High</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('priority', 'urgent')}>Urgent</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                  Archive Selected
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedApplications(new Set())}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredApplications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No applications found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all ({filteredApplications.length})</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <AnimatePresence>
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`overflow-hidden border-border/50 hover:border-border transition-colors ${app.priority === 'high' || app.priority === 'urgent' ? 'border-red-500 border-2' : ''}`}>
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Checkbox
                          checked={selectedApplications.has(app.id)}
                          onCheckedChange={() => toggleSelection(app.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-2xl">{app.username}</CardTitle>
                            {app.priority && (
                              <Badge className={priorityColors[app.priority]}>
                                {priorityLabels[app.priority]}
                              </Badge>
                            )}
                            {applicationScores[app.id] && (
                              <Badge variant="outline" className="font-mono">
                                Score: {applicationScores[app.id].overallScore}/100
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Submitted {new Date(app.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {app.assignedTo && (
                            <p className="text-xs text-muted-foreground mt-1">Assigned to: {app.assignedTo.slice(0, 8)}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAppForNotes(app.id)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Notes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePriorityChange(app.id, 'low')}>
                            <Flag className="h-4 w-4 mr-2" />
                            Priority: Low
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePriorityChange(app.id, 'normal')}>
                            <Flag className="h-4 w-4 mr-2" />
                            Priority: Normal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePriorityChange(app.id, 'high')}>
                            <Flag className="h-4 w-4 mr-2" />
                            Priority: High
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePriorityChange(app.id, 'urgent')}>
                            <Flag className="h-4 w-4 mr-2" />
                            Priority: Urgent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAssign(app.id, null)}>
                            Unassign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <ProfileCard profile={app.discord} />
                      </div>
                      <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age</p>
                            <p className="text-base font-medium">{app.age} years old</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Steam ID</p>
                            <p className="text-sm font-mono">{app.steamId}</p>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CFX Account</p>
                            <a href={app.cfxAccount} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline break-all">
                              {app.cfxAccount}
                            </a>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Roleplay Experience</p>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{app.experience}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Character Backstory</p>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{app.character}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 space-y-3 border-t border-border/50">
                          <Input
                            placeholder="Optional reason for approval/denial..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-background"
                          />
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => handleStatusUpdate(app.id, 'approved')} 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleStatusUpdate(app.id, 'denied')} 
                              variant="destructive"
                              className="flex-1"
                              size="lg"
                            >
                              Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedAppForNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppForNotes(null)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Application Notes</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAppForNotes(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ApplicationNotesPanel
                applicationId={selectedAppForNotes}
                onNoteAdded={() => fetchApplications()}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
