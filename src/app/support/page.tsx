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
import { ExternalLink, LogOut, FileText } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import AdminButton from '@/app/components/admin-button'

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
      <div>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg" />
              <span className="text-2xl font-bold">{applicationConfig.website.serverName}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Rules
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/announcements" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Announcements
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Shop
              </Link>
              <Link href="/support" className="text-sm font-medium text-foreground">
                Support
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <Button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Sign in with Discord
              </Button>
            </div>
          </div>
        </header>

        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto p-4 max-w-4xl">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Please sign in to submit and view support tickets.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg" />
            <span className="text-2xl font-bold">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Rules
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Announcements
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/support" className="text-sm font-medium text-foreground">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {mounted && (
              <>
                <Link href="/apply">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar>
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-application">My Applications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
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

      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">,
          <div>
            <h1 className="text-3xl font-bold">Support</h1>
            <p className="text-muted-foreground">Create a ticket and our staff will get back to you.</p>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value as 'tech'|'rulebreak'|'refund'|'other')}>
                <option value="tech">Technical</option>
                <option value="rulebreak">Rule Violation</option>
                <option value="refund">Refund</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={priority} onChange={e => setPriority(e.target.value as 'low'|'normal'|'high'|'urgent')}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Describe the issue or request in detail" />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit}>Submit Ticket</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <Link key={t.id} href={`/support/${t.id}`}>
                  <div className={`flex items-start justify-between gap-3 border-2 rounded-md p-3 transition-colors cursor-pointer ${getPriorityColor(t.priority)}`}>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {t.subject}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{t.description}</div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <Badge variant="outline">{t.category}</Badge>
                        <Badge className={getPriorityBadgeColor(t.priority)}>{t.priority.toUpperCase()}</Badge>
                        <Badge variant="outline">{t.status}</Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}

