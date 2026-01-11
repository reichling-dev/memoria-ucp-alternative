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
import AdminButton from '../components/admin-button'
import WhitelistForm from '../components/whitelist-form'

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

export default function ApplyPage() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg" />
            <span className="text-2xl font-bold">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Rules
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Announcements
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {discordUser ? (
              <>
                <Link href="/apply">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-10 w-10 cursor-pointer border-2 border-muted hover:border-foreground transition-colors">
                      <AvatarImage src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`} alt={discordUser.username} />
                      <AvatarFallback>{discordUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem disabled>
                      <User className="mr-2 h-4 w-4" />
                      <span>{discordUser.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-application">My Application</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => signIn('discord')}>
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Apply</h1>
          <p className="text-muted-foreground">Select an application type and complete the form.</p>
        </div>
        <WhitelistForm />
      </main>
    </div>
  )
}
