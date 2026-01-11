// Shared type definitions for the application system

export interface DiscordUser {
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

export interface Application {
  id: string
  timestamp: string
  username: string
  applicationType?: 'whitelist' | 'police' | 'ems' | 'sheriff' | string
  age: number
  steamId: string
  cfxAccount: string
  experience: string
  character: string
  characterName?: string
  discord: DiscordUser
  status?: 'pending' | 'approved' | 'denied'
  statusReason?: string
  updatedAt?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  assignedTo?: string // Discord ID of assigned admin
  notes?: ApplicationNote[]
  reviewer?: string // Discord ID of reviewer
  reviewedAt?: string
  draft?: boolean
  lastEditedAt?: string
  version?: number
}

export interface ApplicationNote {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
  edited?: boolean
  editedAt?: string
}

export interface ActivityLog {
  id: string
  type: 'application_created' | 'application_approved' | 'application_denied' | 'application_archived' | 'application_note_added' | 'application_priority_changed' | 'application_assigned' | 'application_unassigned' | 'user_banned' | 'user_unbanned' | 'user_blacklisted' | 'user_unblacklisted' | 'application_exported' | 'bulk_action' | 'announcement_created' | 'announcement_updated' | 'announcement_deleted' | 'purchase_completed' | 'ticket_created' | 'ticket_updated' | 'ticket_note_added' | 'ticket_deleted' | 'application_type_created' | 'application_type_updated' | 'application_type_deleted' | 'rules_updated'
  userId: string
  userName: string
  targetId?: string
  targetName?: string
  details?: Record<string, any>
  timestamp: string
}

export interface ApplicationFilters {
  search?: string
  status?: 'pending' | 'approved' | 'denied' | 'all'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'all'
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  ageMin?: number
  ageMax?: number
}

export interface ApplicationStats {
  total: number
  pending: number
  approved: number
  denied: number
  byPriority: {
    low: number
    normal: number
    high: number
    urgent: number
  }
  averageReviewTime: number
  approvalRate: number
  byDay: Array<{ date: string; count: number }>
  byAdmin: Array<{ adminId: string; adminName: string; count: number }>
}

// Ticketing system types
export type TicketCategory = 'tech' | 'rulebreak' | 'refund' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface TicketNote {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
}

export interface Ticket {
  id: string
  createdAt: string
  updatedAt?: string
  userId: string
  userEmail?: string
  userName?: string
  category: TicketCategory
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: string
  assignedToName?: string
  attachments?: string[]
  notes?: TicketNote[]
}
