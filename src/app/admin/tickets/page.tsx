'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import type { Ticket } from '@/lib/types'
import { CheckCircle, Clock, LifeBuoy, Search, ShieldAlert, Send, X } from 'lucide-react'
import { BackToDashboardButton } from '@/app/components/admin-button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AdminTicketsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permLoading } = usePermissions()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all'|'open'|'in_progress'|'resolved'|'closed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all'|'tech'|'rulebreak'|'refund'|'other'>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading' || permLoading) return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    if (!permissions?.hasAnyStaffRole) {
      router.push('/')
      return
    }
    
    const load = async () => {
      try {
        const res = await fetch('/api/tickets')
        if (res.ok) {
          const data = await res.json()
          setTickets(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to load tickets', err)
        toast({ title: 'Error', description: 'Failed to load tickets', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [status, permLoading, permissions, router, toast])

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const byStatus = statusFilter === 'all' ? true : t.status === statusFilter
      const byCategory = categoryFilter === 'all' ? true : t.category === categoryFilter
      const bySearch = search.trim() === '' ? true : (
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.userEmail || '').toLowerCase().includes(search.toLowerCase())
      )
      return byStatus && byCategory && bySearch
    })
  }, [tickets, statusFilter, categoryFilter, search])

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' })
        return
      }
      const updated = await res.json()
      setTickets(prev => prev.map(t => (t.id === id ? updated : t)))
      if (selectedTicket?.id === id) {
        setSelectedTicket(updated)
      }
      toast({ title: 'Ticket updated' })
    } catch (err) {
      console.error('Update error', err)
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' })
    }
  }

  const addNote = async () => {
    if (!selectedTicket || !noteContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
        return
      }
      const updated = await res.json()
      setTickets(prev => prev.map(t => (t.id === selectedTicket.id ? updated : t)))
      setSelectedTicket(updated)
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

  if (loading || permLoading) return <LoadingPage text="Loading tickets..." />

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><LifeBuoy className="h-6 w-6" /> Support Inbox</h1>
          <p className="text-muted-foreground">Manage user tickets and respond to issues</p>
        </div>
        <div className="flex items-center gap-2">
          <BackToDashboardButton />
          <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all','open','in_progress','resolved','closed'] as const).map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s.replace('_',' ')}
          </Button>
        ))}
        <div className="ml-2">
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as 'all'|'tech'|'rulebreak'|'refund'|'other')}>
            <option value="all">All categories</option>
            <option value="tech">Technical</option>
            <option value="rulebreak">Rule Violation</option>
            <option value="refund">Refund</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No tickets found</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className={`h-full cursor-pointer border-2 transition-all ${getPriorityColor(t.priority)}`} onClick={() => setSelectedTicket(t)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.status === 'resolved' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                  {t.subject}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground line-clamp-2">{t.description}</div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">{t.category}</Badge>
                  <Badge className={getPriorityBadgeColor(t.priority)}>{t.priority.toUpperCase()}</Badge>
                  <Badge variant="outline">{t.status.replace('_',' ')}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">From: {t.userEmail} • {new Date(t.createdAt).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{selectedTicket.category}</Badge>
                <Badge variant="secondary">{selectedTicket.priority}</Badge>
                <Badge variant="outline">{selectedTicket.status.replace('_',' ')}</Badge>
              </div>
              <div>
                <Label>From</Label>
                <p className="text-sm text-muted-foreground">{selectedTicket.userEmail}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket.description}</p>
              </div>

              {selectedTicket.notes && selectedTicket.notes.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Notes & Replies</Label>
                  <div className="space-y-3">
                    {selectedTicket.notes.map(note => (
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
                    placeholder="Write a reply or internal note..."
                  />
                  <div className="flex justify-end">
                    <Button onClick={addNote} disabled={submitting || !noteContent.trim()}>
                      <Send className="h-4 w-4 mr-1" /> Send
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap border-t pt-4">
                {selectedTicket.status !== 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={() => updateTicket(selectedTicket.id, { status: 'in_progress' })}>
                    <Search className="h-4 w-4 mr-1" /> Start
                  </Button>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <Button size="sm" onClick={() => updateTicket(selectedTicket.id, { status: 'resolved' })}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <Button size="sm" variant="destructive" onClick={() => updateTicket(selectedTicket.id, { status: 'closed' })}>
                    <ShieldAlert className="h-4 w-4 mr-1" /> Close
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
