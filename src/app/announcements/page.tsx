'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, User, LogOut, Bell, Calendar, AlertTriangle, Star, Zap, Sparkles } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import AdminButton from '../components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { motion } from 'framer-motion'


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

interface ExtendedSession {
  discord?: DiscordUser
}

interface Announcement {
  id: string
  title: string
  content: string
  type: 'maintenance' | 'event' | 'important' | 'update' | 'community'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt?: string
  createdBy: string
  createdById: string
}

const announcementTypes = [
  { value: 'maintenance', label: 'Maintenance', icon: AlertTriangle, color: 'from-red-500/5 to-red-600/5' },
  { value: 'event', label: 'Event', icon: Star, color: 'from-yellow-500/5 to-yellow-600/5' },
  { value: 'important', label: 'Important', icon: Zap, color: 'from-orange-500/5 to-orange-600/5' },
  { value: 'update', label: 'Update', icon: Bell, color: 'from-blue-500/5 to-blue-600/5' },
  { value: 'community', label: 'Community', icon: Calendar, color: 'from-purple-500/5 to-purple-600/5' }
]

const priorityOptions = [
  { value: 'high', label: 'High Priority', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low Priority', color: 'bg-green-500' }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function Announcements() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements')
        if (response.ok) {
          const data = await response.json()
          setAnnouncements(data)
        } else {
          console.error('Failed to fetch announcements')
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const getTypeInfo = (type: string) => {
    return announcementTypes.find(t => t.value === type) || announcementTypes[0]
  }

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1]
  }

  if (loading) {
    return <LoadingPage text="Loading announcements..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg shadow-lg" />
            <span className="text-2xl font-black bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/rules" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Rules
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-white">
              Announcements
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Shop
            </Link>
            <Link href="/support" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {discordUser ? (
              <>
                <Link href="/apply">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/20">
                    <FileText className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full border-2 border-violet-500/50 hover:border-violet-400 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined} alt={discordUser.username} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-500 text-white">{discordUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{discordUser.username}</p>
                        <p className="w-[200px] truncate text-sm text-white/60">{discordUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-white/5">
                      <Link href="/my-application" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer text-white/80 hover:text-white hover:bg-white/5"
                      onSelect={(event) => {
                        event.preventDefault()
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => signIn('discord')}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0 shadow-lg shadow-[#5865F2]/20"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">Stay in the Loop</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent [text-shadow:_0_4px_20px_rgb(0_0_0_/_40%)]"
          >
            Announcements
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-xl text-white/90 leading-relaxed drop-shadow-lg"
          >
            Stay updated with the latest server news, events, updates, and important announcements from our community.
          </motion.p>
        </div>
      </section>

      {/* Announcements List */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-8">
          {announcements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-white/10 bg-slate-900/40 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                      <Bell className="h-10 w-10 text-violet-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">No Announcements</h3>
                  <p className="text-white/60 text-lg">Check back later for updates and announcements.</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            announcements.map((announcement, index) => {
              const typeInfo = getTypeInfo(announcement.type)
              const priorityInfo = getPriorityInfo(announcement.priority)
              const IconComponent = typeInfo.icon

              // Priority-based styling
              const priorityStyles = {
                high: {
                  border: 'border-red-500/50',
                  hoverBorder: 'hover:border-red-500/70',
                  shadow: 'hover:shadow-red-500/20',
                  bg: 'bg-gradient-to-br from-red-950/30 via-slate-900/60 to-slate-900/40',
                  iconBg: 'from-red-500/30 to-red-600/30',
                  iconColor: 'text-red-300',
                  badgeBg: 'bg-red-500/20',
                  badgeBorder: 'border-red-500/30',
                  badgeText: 'text-red-300'
                },
                medium: {
                  border: 'border-yellow-500/50',
                  hoverBorder: 'hover:border-yellow-500/70',
                  shadow: 'hover:shadow-yellow-500/20',
                  bg: 'bg-gradient-to-br from-yellow-950/30 via-slate-900/60 to-slate-900/40',
                  iconBg: 'from-yellow-500/30 to-yellow-600/30',
                  iconColor: 'text-yellow-300',
                  badgeBg: 'bg-yellow-500/20',
                  badgeBorder: 'border-yellow-500/30',
                  badgeText: 'text-yellow-300'
                },
                low: {
                  border: 'border-green-500/50',
                  hoverBorder: 'hover:border-green-500/70',
                  shadow: 'hover:shadow-green-500/20',
                  bg: 'bg-gradient-to-br from-green-950/30 via-slate-900/60 to-slate-900/40',
                  iconBg: 'from-green-500/30 to-green-600/30',
                  iconColor: 'text-green-300',
                  badgeBg: 'bg-green-500/20',
                  badgeBorder: 'border-green-500/30',
                  badgeText: 'text-green-300'
                }
              }

              const style = priorityStyles[announcement.priority as keyof typeof priorityStyles] || priorityStyles.medium

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={`group ${style.border} ${style.hoverBorder} ${style.bg} backdrop-blur-sm hover:shadow-xl ${style.shadow} transition-all duration-300 hover:-translate-y-1`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconBg} transition-transform group-hover:scale-110`}>
                            <IconComponent className={`h-7 w-7 ${style.iconColor}`} />
                          </div>
                          <div>
                            <CardTitle className="text-3xl font-black mb-3 text-white">{announcement.title}</CardTitle>
                            <div className="flex items-center flex-wrap gap-3 text-sm text-white/60">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(announcement.createdAt)}
                              </span>
                              {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 border border-white/10">
                                  Updated {formatDate(announcement.updatedAt)}
                                </span>
                              )}
                              <Badge variant="secondary" className={`gap-1.5 px-3 py-1 ${style.badgeBg} border ${style.badgeBorder} ${style.badgeText}`}>
                                <div className={`w-2 h-2 rounded-full ${priorityInfo.color} animate-pulse`}></div>
                                {priorityInfo.label}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {announcement.createdBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-white/90 leading-relaxed text-lg drop-shadow-md">
                        {announcement.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-white/10 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                  <Bell className="h-10 w-10 text-violet-400" />
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">Stay Updated</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-md">
                Never miss important announcements, events, or server updates. Join our Discord server to receive real-time notifications and stay connected with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-700 hover:via-blue-700 hover:to-purple-700 shadow-xl shadow-violet-500/20 transition-all hover:scale-105">
                  <Bell className="mr-2 h-5 w-5" />
                  Join Discord Server
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-white/10 bg-slate-800/50 hover:bg-slate-700/50 text-white hover:border-violet-500/50 transition-all hover:scale-105">
                  <Star className="mr-2 h-5 w-5" />
                  Follow on Social Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Ready to start playing?</h3>
              <p className="text-white/80">
                Join our amazing FiveM community and experience roleplay like never before.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/" className="block text-sm text-white/60 hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Home
              </Link>
              <Link href="/rules" className="block text-sm text-white/60 hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Rules
              </Link>
              <Link href="/about" className="block text-sm text-white/60 hover:text-white transition-colors hover:translate-x-1 duration-200">
                → About
              </Link>
              <Link href="/announcements" className="block text-sm text-white/60 hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Announcements
              </Link>
            </div>
            <div>
              <div className="text-sm text-white/60 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="text-violet-400">❤️</span>
                  Made with love for the FiveM community
                </p>
                <p className="mt-4 text-white/60">{applicationConfig.website.footerText}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
