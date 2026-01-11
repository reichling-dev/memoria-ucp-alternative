'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServerStatusResponse {
  status: 'online' | 'offline'
  onlinePlayers: number
  maxPlayers: number
  queueLength: number
  queueEnabled?: boolean
  connectAddress: string
  lastUpdated?: string
  reason?: string
}

function buildConnectUrl(connectAddress: string) {
  if (!connectAddress) return ''
  if (connectAddress.startsWith('fivem://') || connectAddress.startsWith('http')) {
    return connectAddress
  }
  return `https://${connectAddress}`
}

export function ServerStatusCard({ className }: { className?: string }) {
  const [status, setStatus] = useState<ServerStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/server/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to load server status', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const connectUrl = buildConnectUrl(status?.connectAddress || '')
  const isOnline = status?.status === 'online'

  return (
    <Card className={cn('border-primary/20 shadow-sm', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold">Server Status</span>
          </div>
          <Badge className={isOnline ? 'bg-green-600 text-white' : ''} variant={isOnline ? 'secondary' : 'destructive'}>
            {loading ? 'Checking…' : isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        {!loading && !isOnline && status?.reason && (
          <p className="-mt-2 mb-3 text-xs text-muted-foreground">
            Reason: {status.reason}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-end gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                Players
              </div>
              <div className="text-xl font-bold leading-tight">
                {loading ? '—' : `${status?.onlinePlayers ?? 0}/${status?.maxPlayers ?? 0}`}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                Queue
              </div>
              <div className="text-xl font-bold leading-tight">
                {loading ? '—' : status?.queueEnabled === false ? 'N/A' : status?.queueLength ?? 0}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-muted-foreground text-sm">Address</div>
            <div className="text-sm font-medium truncate" title={status?.connectAddress || ''}>
              {loading ? '—' : status?.connectAddress || 'Not set'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!connectUrl || loading}
            onClick={() => connectUrl && (window.location.href = connectUrl)}
            className={cn(
              'flex-1',
              isOnline
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            )}
          >
            {isOnline ? 'Connect' : 'Retry' }
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <a href={connectUrl || '#'} target="_blank" rel="noreferrer" className={connectUrl ? '' : 'pointer-events-none opacity-60'}>
              Copy/Join Link
            </a>
          </Button>
        </div>

        {!loading && status?.lastUpdated && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3" /> Updated {new Date(status.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default ServerStatusCard
