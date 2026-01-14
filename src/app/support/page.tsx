'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoadingPage } from '@/components/ui/loading-spinner'
import type { Ticket } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { ExternalLink, LogOut, FileText, Ticket as TicketIcon, MessageCircle, AlertCircle, Sparkles } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import AdminButton from '@/app/components/admin-button'
import { motion } from 'framer-motion'

export default function SupportPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'tech'|'rulebreak'|'refund'|'other'>('tech')
  const [priority, setPriority] = useState<'low'|'normal'|'high'|'urgent'>('normal')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tickets')
        if (res.ok) {
          const data = await res.json()
          // Show only current user's tickets
          const email = session?.user?.email
          setTickets(Array.isArray(data) ? data.filter((t: Ticket) => t.userEmail === email) : [])
        }
      } catch (err) {
        console.error('Failed to load tickets', err)
      } finally {
        setLoading(false)
      }
    }
    if (status !== 'loading') {
      load()
    }
  }, [status, session?.user?.email])

  const submit = async () => {
    if (!subject || !description) {
      toast({ title: 'Missing fields', description: 'Please provide subject and description', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, category, priority }),
      })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to submit ticket', variant: 'destructive' })
        return
      }
      const ticket = await res.json()
      setTickets(prev => [ticket, ...prev])
      setSubject('')
      setDescription('')
      toast({ title: 'Ticket submitted' })
    } catch (err) {
      console.error('Submit error', err)
      toast({ title: 'Error', description: 'Failed to submit ticket', variant: 'destructive' })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-500/5 hover:bg-red-500/10'
      case 'high':
        return 'border-orange-500 bg-orange-500/5 hover:bg-orange-500/10'
      case 'normal':
        return 'border-blue-500 bg-blue-500/5 hover:bg-blue-500/10'
      case 'low':
        return 'border-gray-500 bg-gray-500/5 hover:bg-gray-500/10'
      default:
        return 'border-border bg-muted/30 hover:bg-muted/40'
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

  if (loading || status === 'loading') return <LoadingPage text="Loading support..." />

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
          <div className="container flex h-20 items-center justify-between px-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg shadow-lg" />
              <span className="text-2xl font-black bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform">{applicationConfig.website.serverName}</span>
            </Link>
            <Button
              onClick={() => signIn('discord')}
              className="relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg shadow-[#5865F2]/30 hover:shadow-xl hover:shadow-[#5865F2]/50 border border-[#7289DA]/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="mr-2 h-4 w-4 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="relative z-10">Sign in with Discord</span>
            </Button>
          </div>
        </header>

        <div className="container mx-auto p-4 max-w-4xl relative z-10 min-h-screen flex items-center justify-center">
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 text-violet-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-white/70">Please sign in to submit and view support tickets.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg shadow-lg" />
            <span className="text-2xl font-black bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Home</Link>
            <Link href="/rules" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Rules</Link>
            <Link href="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">About</Link>
            <Link href="/announcements" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Announcements</Link>
            <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Shop</Link>
            <Link href="/support" className="text-sm font-medium text-white">Support</Link>
          </nav>

          <div className="flex items-center gap-4">
            {mounted && (
              <>
                <Link href="/apply">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold px-5 py-2.5 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
                    <FileText className="mr-2 h-4 w-4 relative z-10" />
                    <span className="relative z-10">Apply</span>
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:scale-110 transition-all">
                      <Avatar className="h-10 w-10 border-2 border-violet-500/30 hover:border-violet-500/60 ring-2 ring-violet-500/0 hover:ring-violet-500/20 transition-all">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10" align="end">
                    <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer">
                      <Link href="/my-application">My Applications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-5xl space-y-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <MessageCircle className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">Get Help</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent mb-4">Support Center</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">Create a ticket and our staff will get back to you as soon as possible.</p>
        </motion.div>

        {/* Create Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <TicketIcon className="w-6 h-6 text-violet-400" />
                Create New Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80 font-semibold">Category</Label>
                  <select className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white backdrop-blur-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all" value={category} onChange={e => setCategory(e.target.value as 'tech'|'rulebreak'|'refund'|'other')}>
                    <option value="tech" className="bg-slate-800">Technical Support</option>
                    <option value="rulebreak" className="bg-slate-800">Rule Violation</option>
                    <option value="refund" className="bg-slate-800">Refund Request</option>
                    <option value="other" className="bg-slate-800">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 font-semibold">Priority</Label>
                  <select className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3 text-white backdrop-blur-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all" value={priority} onChange={e => setPriority(e.target.value as 'low'|'normal'|'high'|'urgent')}>
                    <option value="low" className="bg-slate-800">Low</option>
                    <option value="normal" className="bg-slate-800">Normal</option>
                    <option value="high" className="bg-slate-800">High</option>
                    <option value="urgent" className="bg-slate-800">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 font-semibold">Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of your issue" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 font-semibold">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Describe the issue or request in detail..." className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20" />
              </div>
              <div className="flex justify-end">
                <Button onClick={submit} className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold px-8 py-3 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Submit Ticket
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Tickets Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-violet-400" />
                My Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <TicketIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No tickets yet. Create your first ticket above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t, index) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/support/${t.id}`}>
                        <div className={`group relative overflow-hidden flex items-start justify-between gap-4 border-2 rounded-xl p-5 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl ${getPriorityColor(t.priority)}`}>
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-white flex items-center gap-2 mb-2 group-hover:text-violet-300 transition-colors">
                              {t.subject}
                              <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-violet-400 transition-colors" />
                            </div>
                            <div className="text-sm text-white/70 line-clamp-2 mb-3">{t.description}</div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="border-white/20 text-white/80 bg-white/5">{t.category}</Badge>
                              <Badge className={getPriorityBadgeColor(t.priority)}>{t.priority.toUpperCase()}</Badge>
                              <Badge variant="outline" className="border-white/20 text-white/80 bg-white/5 capitalize">{t.status}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-white/50 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

