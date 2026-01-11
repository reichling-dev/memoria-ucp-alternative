'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import Link from 'next/link'
import confetti from 'canvas-confetti'

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

interface ExtendedSession extends Session {
  discord: DiscordUser
}

type Application = {
  id: string
  timestamp: string
  username: string
  age: number
  steamId: string
  cfxAccount: string
  experience: string
  character: string
  discord: DiscordUser
  status?: 'pending' | 'approved' | 'denied'
}

export default function AdminApplications() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      } else {
        throw new Error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch applications. Please try again.',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'denied') => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application status')
      }

      const data = await response.json()
      toast({
        title: 'Status Updated',
        description: data.message || `Application ${newStatus} successfully and archived.`,
      })
      fetchApplications()
      setReason('')

      if (newStatus === 'approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      } else {
        const pulseEffect = document.createElement('div')
        pulseEffect.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
          pointer-events: none;
          z-index: 9999;
          animation: pulse-fade 1s ease-out;
        `
        const style = document.createElement('style')
        style.textContent = `
          @keyframes pulse-fade {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        `
        document.head.appendChild(style)
        document.body.appendChild(pulseEffect)
        setTimeout(() => {
          document.body.removeChild(pulseEffect)
          document.head.removeChild(style)
        }, 1000)
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: 'Update Error',
        description: error instanceof Error ? error.message : 'There was an error updating the application status.',
        variant: 'destructive',
      })
    }
  }

  if (!(session as ExtendedSession)?.discord) {
    return <div>Access denied. Please log in as an admin.</div>
  }

  const { permissions } = usePermissions()

  if (!permissions?.hasAnyStaffRole) {
    return <div>Access denied. You do not have admin privileges.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Whitelist Applications</h1>
        <div>
          <Link href="/admin/archive">
            <Button variant="outline" className="mr-2">View Archive</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>{app.username}&apos;s Application</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Age:</strong> {app.age}</p>
              <p><strong>Steam ID:</strong> {app.steamId}</p>
              <p><strong>CFX Account:</strong> {app.cfxAccount}</p>
              <p><strong>Discord:</strong> {app.discord.username}#{app.discord.discriminator}</p>
              <p><strong>Experience:</strong> {app.experience}</p>
              <p><strong>Character Backstory:</strong> {app.character}</p>
              <div className="mt-4">
                <Input
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mb-2"
                />
                <div className="flex space-x-2">
                  <Button onClick={() => handleStatusUpdate(app.id, 'approved')} className="bg-green-500 hover:bg-green-600">Approve</Button>
                  <Button onClick={() => handleStatusUpdate(app.id, 'denied')} className="bg-red-500 hover:bg-red-600">Deny</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

