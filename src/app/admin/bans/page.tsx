'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban } from 'lucide-react'
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

type BanEntry = {
  discordId: string
  reason: string
  admin: string
  expires: string | null
  userData?: DiscordUser | null
}

export default function AdminBans() {
  const { status } = useSession()
  const { permissions } = usePermissions()
  const [bans, setBans] = useState<BanEntry[]>([])
  const [filteredBans, setFilteredBans] = useState<BanEntry[]>([])
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

  const fetchBans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        const bansData = data.bans || []

        const bansWithUserData = await Promise.all(
          bansData.map(async (ban: BanEntry) => {
            const userData = await fetchUserData(ban.discordId)
            return { ...ban, userData }
          })
        )

        setBans(bansWithUserData)
        setFilteredBans(bansWithUserData)
      } else {
        throw new Error('Failed to fetch bans')
      }
    } catch (error) {
      console.error('Error fetching bans:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch bans. Please try again.',
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
      fetchBans()
    }
  }, [status, permissions, router, fetchBans])

  const applyFilters = useCallback(() => {
    let filtered = [...bans]

    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase()
      filtered = filtered.filter(ban =>
        ban.discordId.includes(searchLower) ||
        ban.reason.toLowerCase().includes(searchLower) ||
        ban.admin.toLowerCase().includes(searchLower) ||
        ban.userData?.username.toLowerCase().includes(searchLower)
      )
    }

    setFilteredBans(filtered)
  }, [bans, searchValue])

  const handleClear = () => {
    setSearchValue('')
    setDateFrom('')
    setDateTo('')
    setFilteredBans(bans)
  }

  useEffect(() => {
    applyFilters()
  }, [bans, searchValue, applyFilters])

  const handleUnban = async (discordId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unban',
          discordId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unban user')
      }

      toast({
        title: 'Success',
        description: 'User has been unbanned successfully.',
      })

      fetchBans()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unban user.',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading bans...
      </div>
    )
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Banned Users</h1>
          <p className="text-muted-foreground">Manage banned users and their restrictions ({filteredBans.length} of {bans.length})</p>
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

      {filteredBans.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Banned Users Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredBans.map((ban, index) => (
              <motion.div
                key={ban.discordId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
                  <CardHeader className="border-b border-border/50 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1 flex items-center gap-2">
                          <Ban className="w-5 h-5 text-red-600" />
                          {ban.userData?.username || 'Banned User'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Discord ID: <code className="bg-muted px-2 py-1 rounded text-xs">{ban.discordId}</code>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        {ban.userData ? (
                          <Card className="w-full overflow-hidden border-border/50">
                            <CardHeader className="p-0">
                              <div
                                className="h-24 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden"
                                style={{
                                  backgroundImage: ban.userData.banner
                                    ? `url(https://cdn.discordapp.com/banners/${ban.userData.id}/${ban.userData.banner}.png?size=480)`
                                    : 'none',
                                  backgroundColor: ban.userData.accentColor ? `#${ban.userData.accentColor.toString(16).padStart(6, '0')}` : undefined
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
                                    src={ban.userData.avatar
                                      ? `https://cdn.discordapp.com/avatars/${ban.userData.id}/${ban.userData.avatar}.png?size=128`
                                      : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
                                    }
                                    alt={`${ban.userData.username}'s avatar`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{ban.userData.username}</h3>
                                  <p className="text-sm text-muted-foreground">#{ban.userData.discriminator}</p>
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
                            <p className="text-sm leading-relaxed">{ban.reason}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Banned By</p>
                            <p className="text-sm">{ban.admin}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expires</p>
                            <p className="text-sm">
                              {ban.expires ? new Date(ban.expires).toLocaleString() : 'Never'}
                            </p>
                          </div>
                          {ban.userData && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Created</p>
                              <p className="text-sm">{new Date(ban.userData.createdAt).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-4">
                          <Button
                            onClick={() => handleUnban(ban.discordId)}
                            variant="outline"
                            className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                          >
                            Unban User
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
