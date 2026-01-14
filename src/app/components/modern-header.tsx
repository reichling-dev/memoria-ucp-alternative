'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, User, LogOut } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import dynamic from 'next/dynamic'

const AdminButton = dynamic(() => import('./admin-button'), {
  loading: () => <div className="h-10 w-10" />,
})

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

interface ExtendedSession {
  discord?: DiscordUser
}

export default function ModernHeader() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Image 
              src={applicationConfig.website.serverLogo} 
              alt={applicationConfig.website.serverName} 
              width={40} 
              height={40} 
              className="rounded-lg transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {applicationConfig.website.serverName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            Home
          </Link>
          <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            Rules
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            About
          </Link>
          <Link href="/announcements" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            Announcements
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            Shop
          </Link>
          <Link href="/support" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
            Support
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {discordUser ? (
            <>
              <Link href="/apply">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105">
                  <FileText className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </Link>
              <AdminButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer border-2 border-violet-500/20 hover:border-violet-500/60 transition-all hover:scale-110 ring-2 ring-violet-500/0 hover:ring-violet-500/20">
                    <AvatarImage src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`} alt={discordUser.username} />
                    <AvatarFallback>{discordUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span>{discordUser.username}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/my-application">My Application</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => signIn('discord')} 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:scale-105"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
