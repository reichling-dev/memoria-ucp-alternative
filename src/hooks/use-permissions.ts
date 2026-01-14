import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface UserPermissions {
  hasAdminRole: boolean
  hasModeratorRole: boolean
  hasReviewerRole: boolean
  hasAnyStaffRole: boolean
  canReviewApplications: boolean
  canManageBans: boolean
  canViewAnalytics: boolean
  canManageAnnouncements: boolean
  canManageRules: boolean
  canViewActivityLog: boolean
  roles: string[]
}

const defaultPermissions: UserPermissions = {
  hasAdminRole: false,
  hasModeratorRole: false,
  hasReviewerRole: false,
  hasAnyStaffRole: false,
  canReviewApplications: false,
  canManageBans: false,
  canViewAnalytics: false,
  canManageAnnouncements: false,
  canManageRules: false,
  canViewActivityLog: false,
  roles: [],
}

// Client-side cache with 5-minute expiry
let permissionsCache: { data: UserPermissions; timestamp: number; userId: string } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Event system for permission changes
const PERMISSIONS_LOADED_EVENT = 'permissions-loaded'
const dispatchPermissionsLoaded = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PERMISSIONS_LOADED_EVENT))
  }
}

// Function to clear cache (useful for admin role changes)
export function clearPermissionsCache() {
  permissionsCache = null
  dispatchPermissionsLoaded()
}

export function usePermissions() {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions)
  const [loading, setLoading] = useState(false) // Start with false - don't block render

  useEffect(() => {
    async function fetchPermissions() {
      // Don't block if unauthenticated
      if (status === 'unauthenticated' || !session) {
        setPermissions(defaultPermissions)
        setLoading(false)
        return
      }

      const userId = (session as any)?.discord?.id
      
      // Check cache first
      if (permissionsCache && 
          permissionsCache.userId === userId &&
          Date.now() - permissionsCache.timestamp < CACHE_DURATION) {
        setPermissions(permissionsCache.data)
        setLoading(false)
        return
      }

      // Start loading (non-blocking)
      setLoading(true)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

        const response = await fetch('/api/auth/permissions', {
          signal: controller.signal,
          cache: 'no-store'
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          console.log('Permissions fetched successfully:', data)
          setPermissions(data)
          // Cache the result
          permissionsCache = {
            data,
            timestamp: Date.now(),
            userId: userId || ''
          }
          // Notify all components that permissions have loaded
          dispatchPermissionsLoaded()
        } else {
          console.error('Permissions fetch failed with status:', response.status)
          setPermissions(defaultPermissions)
        }
      } catch (error) {
        // Silently fail - don't show loading state if timeout
        console.error('Permissions fetch timed out or failed', error)
        setPermissions(defaultPermissions)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if status is not loading
    if (status !== 'loading') {
      fetchPermissions()
    }
  }, [session?.discord?.id, status])

  return { permissions, loading, status }
}
