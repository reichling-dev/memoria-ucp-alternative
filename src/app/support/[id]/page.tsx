'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut, signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import type { Ticket } from '@/lib/types'
import { ArrowLeft, Send, User, LogOut, FileText, MessageCircle, Clock, Sparkles } from 'lucide-react'
import { applicationConfig } from '@/lib/config'
import AdminButton from '@/app/components/admin-button'
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

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const discordUser = (session as ExtendedSession)?.discord
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const ticketId = params?.id as string | undefined

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`)
        if (!res.ok) {
          toast({ title: 'Error', description: 'Ticket not found', variant: 'destructive' })
          router.push('/support')
          return
        }
        const data = await res.json()
        setTicket(data)
      } catch (err) {
        console.error('Failed to load ticket', err)
        toast({ title: 'Error', description: 'Failed to load ticket', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    if (status !== 'loading' && ticketId) {
      load()
    }
  }, [ticketId, status, toast, router])

  const addNote = async () => {
    if (!noteContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
        return
      }
      const updated = await res.json()
      setTicket(updated)
      setNoteContent('')
      toast({ title: 'Note added' })
    } catch (err) {
      console.error('Add note error', err)
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-500/10 hover:bg-red-500/20'
      case 'high':
        return 'border-orange-500 bg-orange-500/10 hover:bg-orange-500/20'
      case 'normal':
        return 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
      case 'low':
        return 'border-gray-500 bg-gray-500/10 hover:bg-gray-500/20'
      default:
        return 'border-white/10 bg-slate-800/30'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600 text-white hover:bg-red-700'
      case 'high':
        return 'bg-orange-600 text-white hover:bg-orange-700'
      case 'normal':
        return 'bg-blue-600 text-white hover:bg-blue-700'
      case 'low':
        return 'bg-gray-600 text-white hover:bg-gray-700'
      default:
        return ''
    }
  }

  if (loading || status === 'loading') return <LoadingPage text="Loading ticket..." />

  if (!ticket) {
    return (
      <div className="relative min-h-screen bg-slate-950 overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 sticky top-0 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-3 group">
                <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg ring-2 ring-white/10 group-hover:ring-violet-500/50 transition-all" />
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">{applicationConfig.website.serverName}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Home</Link>
                <Link href="/rules" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Rules</Link>
                <Link href="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">About</Link>
                <Link href="/announcements" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Announcements</Link>
                <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Shop</Link>
                <Link href="/support" className="text-sm font-medium text-white transition-colors">Support</Link>
              </nav>

              <Button onClick={() => signIn('discord')} className="relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
                Sign In
              </Button>
            </div>
          </div>
        </header>

        <div className="relative z-10 min-h-screen">
          <div className="container mx-auto p-4 max-w-4xl py-20">
            <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Ticket not found</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 sticky top-0 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <Link href="/" className="flex items-center space-x-3 group">
              <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg ring-2 ring-white/10 group-hover:ring-violet-500/50 transition-all" />
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent hidden sm:inline">{applicationConfig.website.serverName}</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Home</Link>
              <Link href="/rules" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Rules</Link>
              <Link href="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">About</Link>
              <Link href="/announcements" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Announcements</Link>
              <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Shop</Link>
              <Link href="/support" className="text-sm font-medium text-white transition-colors">Support</Link>
            </nav>

            {/* User Menu */}
            {discordUser ? (
              <div className="flex items-center gap-4">
                <Link href="/apply">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                    <span className="relative z-10 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Apply
                    </span>
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-white/10 hover:ring-violet-500/50 transition-all">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                          alt={discordUser.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white">{discordUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900/95 backdrop-blur-xl border-white/10" align="end">
                    <DropdownMenuItem disabled className="text-white">
                      <User className="mr-2 h-4 w-4" />
                      <span>{discordUser.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-white/80 focus:text-white focus:bg-white/10">
                      <Link href="/my-application" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-white/80 focus:text-white focus:bg-white/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <Link href="/support">
              <Button className="bg-slate-800/50 border-white/10 text-white/80 hover:text-white hover:bg-slate-800/80 backdrop-blur-sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tickets
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className={`border-2 ${getPriorityColor(ticket.priority)} backdrop-blur-xl shadow-2xl transition-all duration-300`}>
              <CardHeader className="border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-white mb-3">{ticket.subject}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="border-white/20 text-white/80 bg-white/5">{ticket.category}</Badge>
                      <Badge className={getPriorityBadgeColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                      <Badge variant="outline" className="border-white/20 text-white/80 bg-white/5 capitalize">{ticket.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-white/50 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Clock className="w-3 h-3" />
                      <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                    {ticket.updatedAt && (
                      <div className="flex items-center gap-2 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label className="text-white/80 font-semibold text-lg mb-2 block">Description</Label>
                  <p className="text-white/70 leading-relaxed">{ticket.description}</p>
                </div>

                {ticket.notes && ticket.notes.length > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <Label className="text-white/80 font-semibold text-lg mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-violet-400" />
                      Notes & Replies
                    </Label>
                    <div className="space-y-4">
                      {ticket.notes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:bg-slate-800/60 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs">
                                {note.authorName.charAt(0).toUpperCase()}
                              </div>
                              {note.authorName}
                            </span>
                            <span className="text-xs text-white/40">
                              {new Date(note.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{note.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-6">
                  <Label className="text-white/80 font-semibold text-lg mb-3 block">Add Note</Label>
                  <div className="space-y-3">
                    <Textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      rows={4}
                      placeholder="Write a reply or update..."
                      className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={addNote}
                        disabled={submitting || !noteContent.trim()}
                        className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold px-6 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {submitting ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Reply
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
