'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut, signIn } from 'next-auth/react'
import Link from 'next/link'
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
import { ArrowLeft, Send, User, LogOut } from 'lucide-react'
import { applicationConfig } from '@/lib/config'
import AdminButton from '@/app/components/admin-button'

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
        return 'border-red-500 bg-red-500/5'
      case 'high':
        return 'border-orange-500 bg-orange-500/5'
      case 'normal':
        return 'border-blue-500 bg-blue-500/5'
      case 'low':
        return 'border-gray-500 bg-gray-500/5'
      default:
        return 'border-border bg-muted/30'
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
      <div>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between h-16">
                <span className="font-bold text-lg hidden sm:inline">{applicationConfig.website.serverName}</span>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                <Link href="/rules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/announcements" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Announcements</Link>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
                <Link href="/support" className="text-sm font-medium text-foreground">Support</Link>
              </nav>

              {/* Auth Button */}
              <Button onClick={() => signIn('discord')} size="sm">
                Sign In
              </Button>
            </div>
          </div>
        </header>

        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto p-4 max-w-4xl">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Ticket not found</p>
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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">{applicationConfig.website.serverName}</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/rules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="/announcements" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Announcements</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
              <Link href="/support" className="text-sm font-medium text-foreground">Support</Link>
            </nav>

            {/* User Menu */}
            {discordUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                        alt={discordUser.username}
                      />
                      <AvatarFallback>{discordUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span>{discordUser.username}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AdminButton />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/support">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Ticket Details</h1>
          </div>

      <Card className={`border-2 ${getPriorityColor(ticket.priority)}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{ticket.subject}</CardTitle>
              <div className="mt-2 flex gap-2">
                <Badge variant="outline">{ticket.category}</Badge>
                <Badge className={getPriorityBadgeColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                <Badge variant="outline">{ticket.status.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <div>Created: {new Date(ticket.createdAt).toLocaleString()}</div>
              {ticket.updatedAt && <div>Updated: {new Date(ticket.updatedAt).toLocaleString()}</div>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
          </div>

          {ticket.notes && ticket.notes.length > 0 && (
            <div className="border-t pt-4">
              <Label className="mb-3 block">Notes & Replies</Label>
              <div className="space-y-3">
                {ticket.notes.map(note => (
                  <div key={note.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{note.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Label>Add Note</Label>
            <div className="mt-2 space-y-2">
              <Textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                rows={3}
                placeholder="Write a reply or update..."
              />
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={submitting || !noteContent.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
