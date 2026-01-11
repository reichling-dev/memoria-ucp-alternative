'use client'

import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ArrowLeft, Bell } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

export default function AdminButton() {
  const { data: session } = useSession()
  const { permissions } = usePermissions()
  const [mounted, setMounted] = useState(false)

  // Only render after mount to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show nothing if not authenticated
  if (!mounted || !session) {
    return null
  }

  // Show admin button if authenticated and has staff role
  if (permissions?.hasAnyStaffRole) {
    return (
      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white animate-in fade-in duration-300">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Panel
        </Link>
      </Button>
    )
  }

  // Return null for non-admin users
  return null
}

export function BackToDashboardButton() {
  return (
    <Link href="/admin/dashboard">
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Admin Dashboard
      </Button>
    </Link>
  )
}

export function HomeButton() {
  return (
    <Link href="/">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 !bg-black dark:!bg-white !text-white dark:!text-black !border-gray-700 dark:!border-gray-300 hover:!bg-gray-900 dark:hover:!bg-gray-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </Button>
    </Link>
  )
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { permissions } = usePermissions()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !session || !permissions?.hasAnyStaffRole) {
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/count')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unread || 0)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [mounted, session, permissions])

  if (!mounted || !session || !permissions?.hasAnyStaffRole) {
    return null
  }

  return (
    <Link href="/admin/notifications">
      <Button variant="ghost" size="sm" className="relative animate-in fade-in duration-300">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

