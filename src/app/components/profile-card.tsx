'use client'

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface DiscordUser {
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

export interface ProfileCardProps {
  profile?: DiscordUser
  className?: string
}

export default function ProfileCard({ profile, className }: ProfileCardProps) {
  const { data: session } = useSession()
  const userData = profile || (session as { discord?: DiscordUser })?.discord

  if (!userData) {
    return null
  }

  const { id, username, avatar, banner, accentColor, verified, email, createdAt } = userData
  const avatarUrl = avatar 
    ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` 
    : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
  const bannerUrl = banner 
    ? `https://cdn.discordapp.com/banners/${id}/${banner}.png?size=480` 
    : null

  return (
    <Card className={`w-full overflow-hidden border-border/50 ${className}`}>
      <CardHeader className="p-0">
        <div 
          className="h-32 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden" 
          style={{ 
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
            backgroundColor: accentColor ? `#${accentColor.toString(16).padStart(6, '0')}` : undefined
          }}
        >
          {!bannerUrl && !accentColor && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative px-6 pb-6">
        <div className="flex justify-center -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-card ring-2 ring-border/50">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">{username}</h2>
          <p className="text-xs text-muted-foreground font-mono">ID: {id}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium truncate ml-2">{email || 'Not provided'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Verified</span>
            <span className="text-sm font-medium">
              {verified ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">Unverified</Badge>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Discord Since</span>
            <span className="text-sm font-medium">
              {new Date(createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

