'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import type { ApplicationNote } from '@/lib/types'
import { MessageSquare, Send } from 'lucide-react'

interface ApplicationNotesPanelProps {
  applicationId: string
  onNoteAdded?: () => void
}

export function ApplicationNotesPanel({ applicationId, onNoteAdded }: ApplicationNotesPanelProps) {
  const [notes, setNotes] = useState<ApplicationNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
  }, [applicationId])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes([...notes, data.note])
        setNewNote('')
        toast({
          title: 'Note Added',
          description: 'Your note has been added successfully.',
        })
        onNoteAdded?.()
      } else {
        throw new Error('Failed to add note')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="border-b border-border/50 pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{note.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.timestamp).toLocaleString()}
                        {note.edited && ' (edited)'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={loading || !newNote.trim()} size="sm" className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
