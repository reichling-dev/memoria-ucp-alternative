'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Plus, Edit, Trash2, Bell, AlertTriangle, Star, Zap, Calendar, ChevronDown } from 'lucide-react'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export default function AdminAnnouncements() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions } = usePermissions()
  const { toast } = useToast()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'update' as Announcement['type'],
    priority: 'medium' as Announcement['priority']
  })

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        throw new Error('Failed to fetch announcements')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast({
        title: 'Error',
        description: 'Failed to load announcements.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
      fetchAnnouncements()
    }
  }, [status, permissions, router, fetchAnnouncements])

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'update',
      priority: 'medium'
    })
  }

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          priority: formData.priority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create announcement')
      }

      setShowCreateForm(false)
      resetForm()
      fetchAnnouncements()

      toast({
        title: "Success",
        description: "Announcement created successfully!",
      })
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create announcement.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAnnouncement = async () => {
    if (!editingAnnouncement || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          priority: formData.priority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update announcement')
      }

      setEditingAnnouncement(null)
      resetForm()
      fetchAnnouncements()

      toast({
        title: "Success",
        description: "Announcement updated successfully!",
      })
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update announcement.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete announcement')
      }

      fetchAnnouncements()

      toast({
        title: "Success",
        description: "Announcement deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete announcement.",
        variant: "destructive",
      })
    }
  }

  const openEditForm = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority
    })
  }

  const closeEditForm = () => {
    setEditingAnnouncement(null)
    resetForm()
  }

  const getTypeInfo = (type: string) => {
    return announcementTypes.find(t => t.value === type) || announcementTypes[0]
  }

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1]
  }

  if (status === 'loading' || loading) {
    return <LoadingPage text="Loading announcements..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <BackToDashboardButton />
           
            <h1 className="text-2xl font-bold">Announcement Manager</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Create Announcement Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Manage Announcements</h2>
            <p className="text-muted-foreground mt-2">Create and manage server announcements</p>
          </div>

          <Button size="lg" className="gap-2" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-5 w-5" />
            {showCreateForm ? 'Cancel' : 'Create Announcement'}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingAnnouncement) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Announcement title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Announcement content"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {getTypeInfo(formData.type).label}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {announcementTypes.map(type => (
                        <DropdownMenuItem
                          key={type.value}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value as Announcement['type'] }))}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {getPriorityInfo(formData.priority).label}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {priorityOptions.map(priority => (
                        <DropdownMenuItem
                          key={priority.value}
                          onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as Announcement['priority'] }))}
                        >
                          {priority.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={editingAnnouncement ? handleEditAnnouncement : handleCreateAnnouncement} disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </Button>
                <Button variant="outline" onClick={() => {
                  if (editingAnnouncement) {
                    closeEditForm()
                  } else {
                    setShowCreateForm(false)
                    resetForm()
                  }
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Announcements Yet</h3>
                <p className="text-muted-foreground mb-6">Create your first announcement to get started.</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => {
              const typeInfo = getTypeInfo(announcement.type)
              const priorityInfo = getPriorityInfo(announcement.priority)
              const IconComponent = typeInfo.icon

              return (
                <Card key={announcement.id} className={`border-0 bg-gradient-to-br ${typeInfo.color}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{formatDate(announcement.createdAt)}</span>
                            {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                              <span className="text-xs">(Updated {formatDate(announcement.updatedAt)})</span>
                            )}
                            <Badge variant="secondary" className="gap-1">
                              <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`}></div>
                              {priorityInfo.label}
                            </Badge>
                            <span>By {announcement.createdBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{announcement.content}</p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
