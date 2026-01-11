'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { FileText, User, LogOut, Users, Calendar, Award, Target, Heart } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import Image from 'next/image'
import AdminButton from '../components/admin-button'


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

export default function About() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord

  const stats = [
    { label: 'Active Players', value: '500+', icon: Users },
    { label: 'Server Uptime', value: '99.9%', icon: Award },
    { label: 'Founded', value: '2024', icon: Calendar },
    { label: 'Happy Players', value: '1000+', icon: Heart }
  ]

  const features = [
    {
      title: 'Immersive Roleplay',
      description: 'Experience the most realistic FiveM roleplay environment with custom scripts, detailed character systems, and engaging storylines.',
      icon: Target,
      color: 'from-blue-500/5 to-blue-600/5',
      hoverColor: 'hover:from-blue-500/10 hover:to-blue-600/10'
    },
    {
      title: 'Active Community',
      description: 'Join a welcoming community of dedicated roleplayers who respect the craft and create memorable experiences together.',
      icon: Users,
      color: 'from-purple-500/5 to-purple-600/5',
      hoverColor: 'hover:from-purple-500/10 hover:to-purple-600/10'
    },
    {
      title: 'Regular Events',
      description: 'Participate in weekly events, competitions, and special roleplay scenarios that keep the server fresh and exciting.',
      icon: Calendar,
      color: 'from-green-500/5 to-green-600/5',
      hoverColor: 'hover:from-green-500/10 hover:to-green-600/10'
    },
    {
      title: 'Quality Assurance',
      description: 'Our dedicated staff team ensures fair play, resolves issues quickly, and maintains the highest standards of roleplay.',
      icon: Award,
      color: 'from-orange-500/5 to-orange-600/5',
      hoverColor: 'hover:from-orange-500/10 hover:to-orange-600/10'
    }
  ]

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
            <Link href="/about" className="text-sm font-medium text-foreground">
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
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined} alt={discordUser.username} />
                        <AvatarFallback>{discordUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{discordUser.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{discordUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-application" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault()
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => signIn('discord')}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            About Our Server
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Discover what makes our FiveM roleplay server the ultimate destination for immersive gaming experiences and unforgettable stories.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Our Story
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Founded in 2024, our FiveM roleplay server began as a passion project by a group of dedicated gamers who wanted to create something truly special.
                What started as a small community has grown into one of the most respected roleplay servers in the FiveM ecosystem.
              </p>
              <p>
                We believe that great roleplay comes from attention to detail, respect for the craft, and a commitment to creating memorable experiences.
                Every aspect of our server, from custom scripts to community events, is designed with this philosophy in mind.
              </p>
              <p>
                Today, we continue to innovate and evolve, always striving to provide the most immersive and enjoyable roleplay experience possible.
                Our community of dedicated players and staff work together to create stories that will be remembered long after the server session ends.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-24 w-24 text-primary mx-auto mb-4" />
                  <p className="text-xl font-semibold">Community First</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            What Sets Us Apart
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the features that make our server the premier destination for FiveM roleplay
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className={`group border-0 bg-gradient-to-br ${feature.color} ${feature.hoverColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Target className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              To create the most immersive and enjoyable FiveM roleplay experience possible, where players can escape reality and become whoever they want to be.
              We strive to build a community where creativity flourishes, stories come to life, and every player feels valued and respected.
            </p>
            <div className="mt-8">
              <Link href="/apply">
                <Button size="lg" className="text-lg px-8 py-6">
                  <Users className="mr-2 h-5 w-5" />
                  Join Our Community
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-2xl font-bold mb-4">Ready to start playing?</h3>
              <p className="text-muted-foreground">
                Join our amazing FiveM community and experience roleplay like never before.
              </p>
            </div>
            <div className="space-y-4">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/rules" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Rules
              </Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/announcements" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Announcements
              </Link>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                <p>Made with ❤️ for the FiveM community</p>
                <p className="mt-2">{applicationConfig.website.footerText}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}