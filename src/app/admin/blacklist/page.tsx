'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { motion, AnimatePresence } from 'framer-motion'
import { UserX } from 'lucide-react'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { GenericFilters } from '@/components/generic-filters'

type DiscordUser = {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  banner: string | null
  accentColor: number | null
  verified: boolean
  email?: string
  createdAt: string
}

type BlacklistEntry = {
  discordId: string
  reason: string
  admin: string
  date: string
  userData?: DiscordUser | null
}

export default function AdminBlacklist() {
  const { status } = useSession()
  const { permissions } = usePermissions()
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
  const [filteredBlacklist, setFilteredBlacklist] = useState<BlacklistEntry[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const fetchUserData = useCallback(async (discordId: string): Promise<DiscordUser | null> => {
    try {
      const response = await fetch(`/api/discord/user?id=${discordId}`)
      if (response.ok) {
        const userData = await response.json()
        return {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          banner: userData.banner,
          accentColor: userData.accent_color,
          verified: userData.verified,
          email: userData.email,
          createdAt: userData.createdAt,
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }, [])

  const fetchBlacklist = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        const blacklistData = data.blacklist || []

        const blacklistWithUserData = await Promise.all(
          blacklistData.map(async (entry: BlacklistEntry) => {
            const userData = await fetchUserData(entry.discordId)
            return { ...entry, userData }
          })
        )

        setBlacklist(blacklistWithUserData)
        setFilteredBlacklist(blacklistWithUserData)
      } else {
        throw new Error('Failed to fetch blacklist')
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch blacklist. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, fetchUserData])

  useEffect(() => {
    if (status === 'loading' || !permissions) return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    const isReviewerOnly = permissions?.hasReviewerRole && !permissions?.hasAdminRole && !permissions?.hasModeratorRole
    if (!permissions?.hasAnyStaffRole || isReviewerOnly) {
      router.push('/')
    } else {
      fetchBlacklist()
    }
  }, [status, permissions, router, fetchBlacklist])

  const applyFilters = useCallback(() => {
    let filtered = [...blacklist]

    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.discordId.includes(searchLower) ||
        entry.reason.toLowerCase().includes(searchLower) ||
        entry.admin.toLowerCase().includes(searchLower) ||
        entry.userData?.username.toLowerCase().includes(searchLower)
      )
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter(entry => new Date(entry.date) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(entry => new Date(entry.date) <= toDate)
    }

    setFilteredBlacklist(filtered)
  }, [blacklist, searchValue, dateFrom, dateTo])

  const handleClear = () => {
    setSearchValue('')
    setDateFrom('')
    setDateTo('')
    setFilteredBlacklist(blacklist)
  }

  useEffect(() => {
    applyFilters()
  }, [blacklist, searchValue, dateFrom, dateTo, applyFilters])

  const handleUnblacklist = async (discordId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unblacklist',
          discordId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unblacklist user')
      }

      toast({
        title: 'Success',
        description: 'User has been removed from blacklist successfully.',
      })

      fetchBlacklist()
    } catch (error) {
      console.error('Error unblacklisting user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unblacklist user.',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading blacklist...
      </div>
    )
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Blacklisted Users</h1>
          <p className="text-muted-foreground">Manage blacklisted users and their permanent restrictions ({filteredBlacklist.length} of {blacklist.length})</p>
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
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {filteredBlacklist.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <UserX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Blacklisted Users Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredBlacklist.map((entry, index) => (
              <motion.div
                key={entry.discordId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
                  <CardHeader className="border-b border-border/50 bg-orange-50/50 dark:bg-orange-950/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1 flex items-center gap-2">
                          <UserX className="w-5 h-5 text-orange-600" />
                          {entry.userData?.username || 'Blacklisted User'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Discord ID: <code className="bg-muted px-2 py-1 rounded text-xs">{entry.discordId}</code>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        {entry.userData ? (
                          <Card className="w-full overflow-hidden border-border/50">
                            <CardHeader className="p-0">
                              <div
                                className="h-24 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden"
                                style={{
                                  backgroundImage: entry.userData.banner
                                    ? `url(https://cdn.discordapp.com/banners/${entry.userData.id}/${entry.userData.banner}.png?size=480)`
                                    : 'none',
                                  backgroundColor: entry.userData.accentColor ? `#${entry.userData.accentColor.toString(16).padStart(6, '0')}` : undefined
                                }}
                              >
                                <div className="absolute inset-0 bg-black/20" />
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 -mt-8 relative z-10">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={entry.userData.avatar
                                      ? `https://cdn.discordapp.com/avatars/${entry.userData.id}/${entry.userData.avatar}.png?size=128`
                                      : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
                                    }
                                    alt={`${entry.userData.username}'s avatar`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{entry.userData.username}</h3>
                                  <p className="text-sm text-muted-foreground">#{entry.userData.discriminator}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="w-full overflow-hidden border-border/50">
                            <CardContent className="p-6 text-center">
                              <div className="w-16 h-16 rounded-full border-4 border-muted mx-auto mb-3 flex items-center justify-center">
                                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <p className="text-sm text-muted-foreground">User data unavailable</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</p>
                            <p className="text-sm leading-relaxed">{entry.reason}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blacklisted By</p>
                            <p className="text-sm">{entry.admin}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Blacklisted</p>
                            <p className="text-sm">{new Date(entry.date).toLocaleDateString()}</p>
                          </div>
                          {entry.userData && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Created</p>
                              <p className="text-sm">{new Date(entry.userData.createdAt).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-4">
                          <Button
                            onClick={() => handleUnblacklist(entry.discordId)}
                            variant="outline"
                            className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                          >
                            Remove from Blacklist
                          </Button>
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
    </motion.div>
  )
}
