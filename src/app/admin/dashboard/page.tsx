'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HomeButton } from '@/app/components/admin-button'
import {
  Shield,
  Ban,
  UserX,
  UserCheck,
  FileText,
  Archive,
  Plus,
  BarChart3,
  History,
  Bell,
  ShoppingBag,
  DollarSign,
  LifeBuoy
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

interface ExtendedSession extends Session {
  discord: DiscordUser
}

type BlacklistEntry = {
  discordId: string
  reason: string
  admin: string
  date: string
}

type BanEntry = {
  discordId: string
  reason: string
  admin: string
  expires: string | null
}

type StatsDay = {
  date: string
  count: number
}

type Stats = {
  byDay: StatsDay[]
  total: number
  approved: number
  denied: number
  pending: number
  approvalRate: number
  averageReviewTime: number
}

type RuleCategory = {
  name: string
  rules: Array<{ id: string; text: string }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is reviewer only (not admin or moderator)
  const isReviewerOnly = permissions?.hasReviewerRole && !permissions?.hasAdminRole && !permissions?.hasModeratorRole
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
  const [bans, setBans] = useState<BanEntry[]>([])
  const [archivedCount, setArchivedCount] = useState(0)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [transactionsCount, setTransactionsCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [rulesData, setRulesData] = useState({ categories: [], totalRules: 0, totalCategories: 0 })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false)

  // Form states
  const [banForm, setBanForm] = useState({
    discordId: '',
    reason: '',
    expires: ''
  })

  const [blacklistForm, setBlacklistForm] = useState({
    discordId: '',
    reason: ''
  })

  const fetchUserData = useCallback(async () => {
    try {
      // Fetch user management data (bans and blacklist)
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setBlacklist(data.blacklist || [])
          setBans(data.bans || [])
        } else {
          console.warn('Failed to fetch user management data:', response.status)
        }
      } catch (error) {
        console.warn('Error fetching user management:', error)
      }

      // Fetch archived applications count
      try {
        const archiveResponse = await fetch('/api/applications/archive')
        if (archiveResponse.ok) {
          const archivedData = await archiveResponse.json()
          setArchivedCount(Array.isArray(archivedData) ? archivedData.length : 0)
        }
      } catch (error) {
        console.warn('Error fetching archived applications:', error)
      }

      // Fetch transactions count and revenue
      try {
        const transactionsResponse = await fetch('/api/payments/transactions')
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactionsCount(Array.isArray(transactionsData) ? transactionsData.length : 0)
          const revenue = transactionsData
            .filter((t: { status: string }) => t.status === 'completed')
            .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
          setTotalRevenue(revenue)
        }
      } catch (error) {
        console.warn('Error fetching transactions:', error)
      }

      // Fetch applications count
      try {
        const applicationsResponse = await fetch('/api/applications')
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          setApplicationsCount(Array.isArray(applicationsData) ? applicationsData.length : 0)
        }
      } catch (error) {
        console.warn('Error fetching applications count:', error)
      }

      // Fetch statistics for graphs
      try {
        const statsResponse = await fetch('/api/applications/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.warn('Error fetching statistics:', error)
      }

      // Fetch stale notifications count
      try {
        const notificationsResponse = await fetch('/api/notifications/stale')
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          // Stale notifications data fetched but not currently used in UI
          console.debug('Stale notifications count:', notificationsData.count || 0)
        }
      } catch (error) {
        console.warn('Error fetching stale notifications:', error)
      }

      // Fetch rules data
      try {
        const rulesResponse = await fetch('/api/rules')
        if (rulesResponse.ok) {
          const rulesJson = await rulesResponse.json()
          const categories = rulesJson.categories || [] as RuleCategory[]
          const totalRules = categories.reduce((sum: number, cat: RuleCategory) => sum + cat.rules.length, 0)
          setRulesData({ categories, totalRules, totalCategories: categories.length })
        }
      } catch (error) {
        console.warn('Error fetching rules:', error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Unexpected error in dashboard data fetch:', errorMessage)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading dashboard data.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // Don't redirect while permissions are loading or session is loading
    if (permissionsLoading || status === 'loading') {
      return
    }
    
    // Wait for authenticated session before checking permissions
    if (status !== 'authenticated') {
      router.push('/')
      return
    }

    // If authenticated but no permissions data yet (roles array is empty and no staff role), wait
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) {
      return
    }
    
    // Check if user has permission to access admin panel
    if (!permissions?.hasAnyStaffRole) {
      router.push('/')
    } else {
      fetchUserData()
    }
  }, [status, permissions, permissionsLoading, router, fetchUserData])

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!banForm.discordId || !banForm.reason) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban',
          discordId: banForm.discordId,
          reason: banForm.reason,
          admin: (session as ExtendedSession)?.discord?.username || 'Unknown Admin',
          expires: banForm.expires || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to ban user')
      }

      toast({
        title: 'Success',
        description: 'User has been banned successfully.',
      })

      setBanForm({ discordId: '', reason: '', expires: '' })
      setBanDialogOpen(false)
      fetchUserData()
    } catch (error) {
      console.error('Error banning user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to ban user.',
        variant: 'destructive',
      })
    }
  }

  const handleBlacklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blacklistForm.discordId || !blacklistForm.reason) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'blacklist',
          discordId: blacklistForm.discordId,
          reason: blacklistForm.reason,
          admin: (session as ExtendedSession)?.discord?.username || 'Unknown Admin'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to blacklist user')
      }

      toast({
        title: 'Success',
        description: 'User has been blacklisted successfully.',
      })

      setBlacklistForm({ discordId: '', reason: '' })
      setBlacklistDialogOpen(false)
      fetchUserData()
    } catch (error) {
      console.error('Error blacklisting user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to blacklist user.',
        variant: 'destructive',
      })
    }
  }

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

      fetchUserData()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unban user.',
        variant: 'destructive',
      })
    }
  }

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

      fetchUserData()
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
    return <LoadingPage text="Loading admin dashboard..." />
  }

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading admin dashboard...
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, applications, and server settings</p>
        </div>
        <div className="flex gap-2 items-center">

          <HomeButton />
          
          {/* Ban/Blacklist Action Buttons - Hide for reviewers */}
          {!isReviewerOnly && (
            <div className="flex gap-2">
          <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Ban className="h-4 w-4" />
                Ban User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Ban User
                </DialogTitle>
                <DialogDescription>
                  Ban a user from accessing the server. You can set an optional expiration date.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBan} className="space-y-4">
                <div>
                  <Label htmlFor="ban-discord-id">Discord ID</Label>
                  <Input
                    id="ban-discord-id"
                    value={banForm.discordId}
                    onChange={(e) => setBanForm(prev => ({ ...prev, discordId: e.target.value }))}
                    placeholder="Enter Discord ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ban-reason">Reason</Label>
                  <Textarea
                    id="ban-reason"
                    value={banForm.reason}
                    onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for ban"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ban-expires">Expires (optional)</Label>
                  <Input
                    id="ban-expires"
                    type="datetime-local"
                    value={banForm.expires}
                    onChange={(e) => setBanForm(prev => ({ ...prev, expires: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setBanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <UserX className="h-4 w-4" />
                Blacklist User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Blacklist User
                </DialogTitle>
                <DialogDescription>
                  Add a user to the blacklist to prevent them from submitting applications.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBlacklist} className="space-y-4">
                <div>
                  <Label htmlFor="blacklist-discord-id">Discord ID</Label>
                  <Input
                    id="blacklist-discord-id"
                    value={blacklistForm.discordId}
                    onChange={(e) => setBlacklistForm(prev => ({ ...prev, discordId: e.target.value }))}
                    placeholder="Enter Discord ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="blacklist-reason">Reason</Label>
                  <Textarea
                    id="blacklist-reason"
                    value={blacklistForm.reason}
                    onChange={(e) => setBlacklistForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for blacklist"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive">
                    <Plus className="h-4 w-4 mr-2" />
                    Blacklist User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Review and manage whitelist applications
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {applicationsCount}
            </div>
            <div className="mt-auto">
              <Link href="/admin/applications">
                <Button className="w-full">
                  View Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {!isReviewerOnly && (
          <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Application Types
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage application types
              </p>
              <div className="mt-auto">
                <Link href="/admin/applications/types">
                  <Button className="w-full">
                    Manage Types
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Archive className="h-5 w-5" />
              Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              View archived applications
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {archivedCount}
            </div>
            <div className="mt-auto">
              <Link href="/admin/archive">
                <Button className="w-full">
                  View Archive
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Hide non-application cards for reviewers */}
        {!isReviewerOnly && (
          <>
            <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ban className="h-5 w-5" />
              Bans
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Manage banned users
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {bans.length}
            </div>
            <div className="mt-auto">
              <Link href="/admin/bans">
                <Button className="w-full">
                  View Bans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserX className="h-5 w-5" />
              Blacklist
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Manage blacklisted users
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {blacklist.length}
            </div>
            <div className="mt-auto">
              <Link href="/admin/blacklist">
                <Button className="w-full">
                  View Blacklist
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              View application statistics and insights
            </p>
            <div className="mt-auto">
              <Link href="/admin/analytics">
                <Button className="w-full">
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5" />
              Shop Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Create, edit, and remove shop packages
            </p>
            <div className="mt-auto">
              <Link href="/admin/shop">
                <Button className="w-full">
                  Go to Shop Manager
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LifeBuoy className="h-5 w-5" />
              Support Inbox
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Manage user tickets and support requests
            </p>
            <div className="mt-auto">
              <Link href="/admin/tickets">
                <Button className="w-full">
                  Go to Support Inbox
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              View system activity and audit trail
            </p>
            <div className="mt-auto">
              <Link href="/admin/activity-log">
                <Button className="w-full">
                  View Activity Log
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage server announcements
            </p>
            <div className="mt-auto">
              <Link href="/admin/announcements">
                <Button className="w-full">
                  Manage Announcements
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              View all payment transactions and revenue
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {transactionsCount}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              ${totalRevenue.toFixed(2)} total revenue
            </div>
            <div className="mt-auto">
              <Link href="/admin/transactions">
                <Button className="w-full">
                  View Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              Manage server rules and categories
            </p>
            <div className="text-2xl font-bold text-primary mb-2">
              {rulesData.totalRules} rules in {rulesData.totalCategories} categories
            </div>
            <div className="mt-auto">
              <Link href="/admin/rules">
                <Button className="w-full">
                  Edit Rules
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Application Statistics Charts - Hide for reviewers */}
      {!isReviewerOnly && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Applications Over Time (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              {stats.byDay && stats.byDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.byDay.map((day: StatsDay) => ({
                    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: day.count,
                    fullDate: day.date
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground w-full">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium min-w-[70px]">Approved</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                    <div className="flex-1 bg-muted rounded-full h-4 min-w-0">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[40px] text-right">{stats.approved}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium min-w-[70px]">Denied</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                    <div className="flex-1 bg-muted rounded-full h-4 min-w-0">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.denied / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[40px] text-right">{stats.denied}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium min-w-[70px]">Pending</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                    <div className="flex-1 bg-muted rounded-full h-4 min-w-0">
                      <div
                        className="bg-yellow-500 h-full rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[40px] text-right">{stats.pending}</span>
                  </div>
                </div>
                <div className="pt-6 border-t mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.approvalRate?.toFixed(1) || 0}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Approval Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.averageReviewTime?.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Avg Review Time (hrs)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{stats.total || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Applications</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Section - Hide for reviewers */}
      {!isReviewerOnly && (
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
      

        {/* Current Bans and Blacklists */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Recent Bans ({bans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No banned users</p>
              ) : (
                <div className="space-y-3">
                  {bans.slice(-10).reverse().map((ban, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ban.discordId}</p>
                        <p className="text-sm text-muted-foreground">{ban.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          By {ban.admin} • Expires: {ban.expires ? new Date(ban.expires).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(ban.discordId)}
                        className="ml-2"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Recent Blacklist  ({blacklist.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blacklist.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No blacklisted users</p>
              ) : (
                <div className="space-y-3">
                  {blacklist
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{entry.discordId}</p>
                        <p className="text-sm text-muted-foreground">{entry.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          By {entry.admin} • {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblacklist(entry.discordId)}
                        className="ml-2"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </motion.div>
  )
}