'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { usePermissions } from '@/hooks/use-permissions'
import {  Archive } from 'lucide-react'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { GenericFilters } from '@/components/generic-filters'
import ProfileCard from '@/app/components/profile-card'
import { LoadingPage } from '@/components/ui/loading-spinner'

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

type ArchivedApplication = {
  id: string
  timestamp: string
  username: string
  age: number
  steamId: string
  cfxAccount: string
  experience: string
  character: string
  discord: DiscordUser
  status: 'approved' | 'denied'
  statusReason?: string
  updatedAt: string
}

export default function ArchivedApplications() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [archivedApplications, setArchivedApplications] = useState<ArchivedApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ArchivedApplication[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchArchivedApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/applications/archive')
      if (response.ok) {
        const data = await response.json()
        setArchivedApplications(data)
        setFilteredApplications(data)
      } else {
        throw new Error('Failed to fetch archived applications')
      }
    } catch (error) {
      console.error('Error fetching archived applications:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch archived applications. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
      fetchArchivedApplications()
    }
  }, [status, permissions, permissionsLoading, router, fetchArchivedApplications])

  const applyFilters = useCallback(() => {
    let filtered = [...archivedApplications]

    // Search filter
    // Search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase()

      filtered = filtered.filter(app =>
        (app.username || '').toLowerCase().includes(searchLower) ||
        (app.discord?.id || '').toLowerCase().includes(searchLower) ||
        (app.discord?.username || '').toLowerCase().includes(searchLower) ||
        (app.steamId || '').toLowerCase().includes(searchLower) ||
        (app.statusReason || '').toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter(app => new Date(app.timestamp) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(app => new Date(app.timestamp) <= toDate)
    }

    setFilteredApplications(filtered)
  }, [archivedApplications, searchValue, statusFilter, dateFrom, dateTo])

  const handleClear = () => {
    setSearchValue('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setFilteredApplications(archivedApplications)
  }

  if (status === 'loading' || loading || permissionsLoading) {
    return <LoadingPage text="Loading archived applications..." />
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Archived Applications</h1>
          <p className="text-muted-foreground">View all processed applications ({filteredApplications.length} of {archivedApplications.length})</p>
        </div>
        <div className="flex gap-2">
          <BackToDashboardButton />
         
        </div>
      </div>

      <GenericFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={applyFilters}
        onClear={handleClear}
        statusFilter={{
          value: statusFilter,
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'approved', label: 'Approved' },
            { value: 'denied', label: 'Denied' },
          ],
          onChange: setStatusFilter,
        }}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {filteredApplications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Archive className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No archived applications found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1">{app.username}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {app.status === 'approved' ? (
                            <span className="text-green-600 font-medium">Approved</span>
                          ) : (
                            <span className="text-red-600 font-medium">Denied</span>
                          )}
                          {' • '}
                          Submitted {new Date(app.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {' • '}
                          Reviewed {new Date(app.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
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

                        {app.statusReason && (
                          <div className="pt-4 border-t border-border/50">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Reviewer Notes</p>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                              <p className="text-sm">{app.statusReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
