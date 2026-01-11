import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserRoles } from '@/lib/discord-bot'
import { 
  hasAdminRole, 
  hasModeratorRole, 
  hasReviewerRole,
  hasAnyStaffRole,
  hasPermission,
  applicationConfig
} from '@/lib/config'

/**
 * GET /api/auth/permissions
 * Returns the current user's permissions and roles
 * Cached for 2 minutes to reduce load
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discordId = session.discord.id
    let userRoles: string[] = []

    // Fetch Discord roles with caching (handled in getUserRoles)
    try {
      userRoles = await getUserRoles(discordId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error fetching user roles for ${discordId}:`, errorMessage)
      // Continue with empty roles if fetch fails
    }

    // Calculate permissions
    const permissions = {
      // Basic role checks
      hasAdminRole: hasAdminRole(userRoles),
      hasModeratorRole: hasModeratorRole(userRoles),
      hasReviewerRole: hasReviewerRole(userRoles),
      hasAnyStaffRole: hasAnyStaffRole(userRoles),
      
      // Specific permissions
      canReviewApplications: hasPermission(userRoles, 'canReviewApplications'),
      canManageBans: hasPermission(userRoles, 'canManageBans'),
      canViewAnalytics: hasPermission(userRoles, 'canViewAnalytics'),
      canManageAnnouncements: hasPermission(userRoles, 'canManageAnnouncements'),
      canManageRules: hasPermission(userRoles, 'canManageRules'),
      canViewActivityLog: hasPermission(userRoles, 'canViewActivityLog'),
      
      // User's Discord roles
      roles: userRoles,
      
      // Configured roles from config
      configuredRoles: {
        admin: applicationConfig.roles.adminRoles,
        moderator: applicationConfig.roles.moderatorRoles,
        reviewer: applicationConfig.roles.reviewerRoles,
        priority: applicationConfig.roles.priorityRoles,
      }
    }

    // Cache for 2 minutes
    return NextResponse.json(permissions, {
      headers: {
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error checking permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
