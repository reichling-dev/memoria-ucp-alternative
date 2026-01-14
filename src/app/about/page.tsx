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
import { FileText, User, LogOut, Users, Calendar, Award, Target, Heart, Sparkles } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import Image from 'next/image'
import AdminButton from '../components/admin-button'
import { motion } from 'framer-motion'


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
    { label: 'Active Players', value: '500+', icon: Users, gradient: 'from-blue-500/20 to-blue-600/20' },
    { label: 'Server Uptime', value: '99.9%', icon: Award, gradient: 'from-green-500/20 to-green-600/20' },
    { label: 'Founded', value: '2024', icon: Calendar, gradient: 'from-purple-500/20 to-purple-600/20' },
    { label: 'Happy Players', value: '1000+', icon: Heart, gradient: 'from-pink-500/20 to-pink-600/20' }
  ]

  const features = [
    {
      title: 'Immersive Roleplay',
      description: 'Experience the most realistic FiveM roleplay environment with custom scripts, detailed character systems, and engaging storylines.',
      icon: Target,
      gradient: 'from-blue-500/10 to-blue-600/20'
    },
    {
      title: 'Active Community',
      description: 'Join a welcoming community of dedicated roleplayers who respect the craft and create memorable experiences together.',
      icon: Users,
      gradient: 'from-purple-500/10 to-purple-600/20'
    },
    {
      title: 'Regular Events',
      description: 'Participate in weekly events, competitions, and special roleplay scenarios that keep the server fresh and exciting.',
      icon: Calendar,
      gradient: 'from-green-500/10 to-green-600/20'
    },
    {
      title: 'Quality Assurance',
      description: 'Our dedicated staff team ensures fair play, resolves issues quickly, and maintains the highest standards of roleplay.',
      icon: Award,
      gradient: 'from-orange-500/10 to-orange-600/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
              Home
            </Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-white transition-all hover:scale-105">
              Rules
            </Link>
            <Link href="/about" className="text-sm font-medium text-white">
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
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-110 transition-transform">
                      <Avatar className="h-10 w-10 border-2 border-violet-500/20 hover:border-violet-500/60 ring-2 ring-violet-500/0 hover:ring-violet-500/20 transition-all">
                        <AvatarImage src={discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined} alt={discordUser.username} />
                        <AvatarFallback>{discordUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{discordUser.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{discordUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href="/my-application" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
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
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0 shadow-lg shadow-[#5865F2]/20 transition-all hover:scale-105"
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
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-400">Our Community</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent mb-6">
              About Our Server
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-white/90 leading-relaxed drop-shadow-lg">
              Discover what makes our FiveM roleplay server the ultimate destination for immersive gaming experiences and unforgettable stories.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-sm hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 text-center h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient}`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="text-4xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-2">{stat.value}</div>
                    <div className="text-white/80 font-medium drop-shadow-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 lg:grid-cols-2 items-center"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent mb-6">
              Our Story
            </h2>
            <div className="space-y-6 text-lg text-white/90 leading-relaxed drop-shadow-md">
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-[4/5] rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-24 w-24 text-violet-400 mx-auto mb-4" />
                  <p className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Community First</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent mb-4">
            What Sets Us Apart
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Experience the features that make our server the premier destination for FiveM roleplay
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className={`group border-white/10 bg-gradient-to-br ${feature.gradient} bg-slate-900/60 backdrop-blur-md hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 h-full`}>
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 transition-transform group-hover:scale-110">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-white">{feature.title}</CardTitle>
                    </div>
                    <p className="text-white/90 leading-relaxed text-lg drop-shadow-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-white/10 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                  <Target className="h-10 w-10 text-violet-400" />
                </div>
              </div>
              <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">Our Mission</h2>
              <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
                To create the most immersive and enjoyable FiveM roleplay experience possible, where players can escape reality and become whoever they want to be.
                We strive to build a community where creativity flourishes, stories come to life, and every player feels valued and respected.
              </p>
              <div className="mt-10">
                <Link href="/apply">
                  <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-700 hover:via-blue-700 hover:to-purple-700 shadow-xl shadow-violet-500/20 transition-all hover:scale-105">
                    <Users className="mr-2 h-5 w-5" />
                    Join Our Community
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Ready to start playing?</h3>
              <p className="text-white/80 drop-shadow-sm">
                Join our amazing FiveM community and experience roleplay like never before.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Home
              </Link>
              <Link href="/rules" className="block text-sm text-muted-foreground hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Rules
              </Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-white transition-colors hover:translate-x-1 duration-200">
                → About
              </Link>
              <Link href="/announcements" className="block text-sm text-muted-foreground hover:text-white transition-colors hover:translate-x-1 duration-200">
                → Announcements
              </Link>
            </div>
            <div>
              <div className="text-sm text-white/80 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="text-violet-400">❤️</span>
                  Made with love for the FiveM community
                </p>
                <p className="mt-4 text-white/60">{applicationConfig.website.footerText}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}