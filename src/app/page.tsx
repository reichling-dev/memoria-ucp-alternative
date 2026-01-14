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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, User, LogOut, Megaphone } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { applicationConfig } from '@/lib/config'
import dynamic from 'next/dynamic'

// Lazy load non-critical components
const AdminButton = dynamic(() => import('./components/admin-button'), {
  loading: () => <div className="h-10 w-10" />,
})
const FiveMConnectCard = dynamic(() => import('./components/fivem-connect-card'), {
  ssr: false,
  loading: () => <Card className="h-32 animate-pulse bg-muted" />,
})


interface Announcement {
  id: string
  title: string
  content: string
  type: 'maintenance' | 'event' | 'important' | 'update' | 'community'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt?: string
  createdBy: string
  createdById: string
}



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

export default function Home() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord

  // Slider images
  const sliderImages = [
    '/images/index/hero.jpg',
    '/images/index/hero2.jpg',
    '/images/index/hero3.jpg',
    '/images/index/hero4.jpg',
    '/images/index/vertical.jpg',
    '/images/index/vertical2.jpg'
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch announcements - defer to not block initial render
  useEffect(() => {
    if (!mounted) return

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements')
        if (response.ok) {
          const data = await response.json()
          setAnnouncements(data)
          
          // Check if there are new announcements (high priority) that haven't been dismissed
          const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
          setDismissedAnnouncements(dismissed)
          
          const newHighPriorityAnnouncement = data.find(
            (ann: Announcement) => ann.priority === 'high' && !dismissed.includes(ann.id)
          )
          
          if (newHighPriorityAnnouncement) {
            setShowAnnouncementModal(true)
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    // Defer announcements fetch by 500ms to prioritize initial page load
    const timer = setTimeout(fetchAnnouncements, 500)
    return () => clearTimeout(timer)
  }, [mounted])

  const handleDismissAnnouncement = (announcementId: string) => {
    const updated = [...dismissedAnnouncements, announcementId]
    setDismissedAnnouncements(updated)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated))
    
    // Check if there are more high-priority announcements to show
    const nextAnnouncement = announcements.find(
      (ann) => ann.priority === 'high' && !updated.includes(ann.id)
    )
    
    if (!nextAnnouncement) {
      setShowAnnouncementModal(false)
    }
  }

  const currentAnnouncement = announcements.find(
    (ann) => ann.priority === 'high' && !dismissedAnnouncements.includes(ann.id)
  )

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧'
      case 'event':
        return '🎉'
      case 'important':
        return '⚠️'
      case 'update':
        return '🆕'
      case 'community':
        return '💬'
      default:
        return '📢'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-orange-500'
      case 'event':
        return 'bg-purple-500'
      case 'important':
        return 'bg-red-500'
      case 'update':
        return 'bg-blue-500'
      case 'community':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(timer)
  }, [sliderImages.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length)
  }

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

      {/* Announcement Modal */}
      {mounted && (
        <Dialog open={showAnnouncementModal && !!currentAnnouncement} onOpenChange={setShowAnnouncementModal}>
          <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${getTypeColor(currentAnnouncement?.type || 'important')}`}>
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl">
                    {getAnnouncementIcon(currentAnnouncement?.type || 'important')} {currentAnnouncement?.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={currentAnnouncement?.priority === 'high' ? 'destructive' : 'secondary'}>
                      {currentAnnouncement?.priority?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize border-white/20">
                      {currentAnnouncement?.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentAnnouncement && new Date(currentAnnouncement.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <DialogDescription className="text-base text-foreground mt-4 whitespace-pre-wrap">
                {currentAnnouncement?.content}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                className="relative overflow-hidden border-white/20 hover:border-violet-500/50 bg-slate-800/30 hover:bg-slate-700/50 backdrop-blur-md text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => {
                  if (currentAnnouncement) {
                    handleDismissAnnouncement(currentAnnouncement.id)
                  }
                }}
              >
                <span className="relative z-10">Don&apos;t Show Again</span>
              </Button>
              <Link href="/announcements">
                <Button onClick={() => setShowAnnouncementModal(false)} className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold px-6 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                  <span className="relative z-10">View All Announcements</span>
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg transition-transform group-hover:scale-110" priority />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-all hover:scale-105">
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
            {mounted && discordUser ? (
              <>
                <Link href="/apply">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold px-5 py-2.5 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                    <FileText className="mr-2 h-4 w-4 relative z-10" />
                    <span className="relative z-10">Apply</span>
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
            ) : mounted ? (
              <Button
                onClick={() => signIn('discord')}
                className="relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg shadow-[#5865F2]/30 hover:shadow-xl hover:shadow-[#5865F2]/50 border border-[#7289DA]/30 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
              >
                <svg className="mr-2 h-4 w-4 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="relative z-10">Login with Discord</span>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Slider Section */}
      <section className="relative h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={sliderImages[currentIndex]}
              alt={`FiveM Server Scene ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/70 to-slate-950" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Content Overlay */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 gap-12">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                {applicationConfig.website.headerTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-white/90 sm:text-2xl leading-relaxed drop-shadow-lg">
                {applicationConfig.website.headerSubtitle}
              </p>
            </motion.div>
          </div>

          {/* FiveM Status Card */}
          <div className="container mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Card className="border-white/20 bg-gradient-to-br from-slate-900/80 via-violet-900/20 to-slate-900/80 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-8">
                  <FiveMConnectCard className="w-full" />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Slider Navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-5 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl text-white hover:from-violet-600/80 hover:to-blue-600/90 border-2 border-white/30 hover:border-violet-400/60 shadow-xl shadow-slate-900/50 hover:shadow-2xl hover:shadow-violet-500/40 transition-all duration-300 hover:scale-125 active:scale-95 group"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-5 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl text-white hover:from-violet-600/80 hover:to-blue-600/90 border-2 border-white/30 hover:border-violet-400/60 shadow-xl shadow-slate-900/50 hover:shadow-2xl hover:shadow-violet-500/40 transition-all duration-300 hover:scale-125 active:scale-95 group"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
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
            Why Choose Us
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Experience the ultimate FiveM roleplay with cutting-edge features
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "/images/Bulb.svg", title: "Character Creation", desc: "Create detailed characters with custom appearances, backgrounds, and personalities. Build your story from the ground up in our immersive roleplay world.", gradient: "from-blue-500/10 to-blue-600/20" },
            { icon: "/images/Puzzle.svg", title: "Realistic Roleplay", desc: "Experience authentic roleplay mechanics with dynamic weather, day/night cycles, and realistic vehicle handling that brings Los Santos to life.", gradient: "from-purple-500/10 to-purple-600/20" },
            { icon: "/images/Calender.svg", title: "Dynamic Economy", desc: "Participate in a living economy with jobs, businesses, and market fluctuations. Build wealth through legitimate means or take risks in the underground.", gradient: "from-orange-500/10 to-orange-600/20" },
            { icon: "/images/shield.svg", title: "Active Community", desc: "Join a dedicated community of roleplayers who respect the craft. Regular events, storylines, and collaborative storytelling make every session memorable.", gradient: "from-green-500/10 to-green-600/20" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`group border-white/10 bg-gradient-to-br ${feature.gradient} bg-slate-900/60 backdrop-blur-md hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 h-full`}>
                <CardContent className="p-8 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                    <Image src={feature.icon} alt={feature.title} width={32} height={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-md">{feature.title}</h2>
                  <p className="text-white/90 leading-relaxed drop-shadow-sm">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "/images/car-sideview.svg", title: "How to play FiveM", desc: "Learn the basics of getting started with our FiveM server.", gradient: "from-blue-500/20 to-blue-600/30" },
            { icon: "/images/mountains.svg", title: "What is FiveM?", desc: "Discover what makes FiveM the ultimate GTA V multiplayer experience.", gradient: "from-purple-500/20 to-purple-600/30" },
            { icon: "/images/car-sideview.svg", title: "How to connect", desc: "Step-by-step guide to joining our server.", gradient: "from-cyan-500/20 to-cyan-600/30" },
            { icon: "/images/mountains.svg", title: "Will you have fun?", desc: "Absolutely! Join our amazing community today.", gradient: "from-pink-500/20 to-pink-600/30" }
          ].map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`group border-white/20 bg-gradient-to-br ${info.gradient} bg-slate-800/40 backdrop-blur-md hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full`}>
                <CardContent className="p-8 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/50 to-blue-500/50 mx-auto mb-6 transition-all duration-300 group-hover:scale-110 shadow-lg">
                    <Image src={info.icon} alt={info.title} width={32} height={32} className="invert brightness-0 invert" />
                  </div>
                <h3 className="text-xl font-bold mb-3 text-white drop-shadow-md">{info.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm">{info.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 lg:grid-cols-2 items-center"
        >
          <div>
            <h2 className="text-5xl font-black tracking-tight mb-6 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
              Your website can stand out, or not, you decide.
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
              Join our exclusive roleplay server and start your journey today. Experience the best FiveM has to offer with our professional community.
            </p>
            <Link href="/apply">
              <Button size="lg" className="group relative overflow-hidden text-lg px-12 py-8 bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-2xl shadow-violet-500/40 hover:shadow-3xl hover:shadow-violet-500/60 border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                <FileText className="mr-3 h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">Ready to start playing?</span>
              </Button>
            </Link>
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
              <Image
                src="/images/index/vertical2.jpg"
                alt="FiveM Server"
                width={400}
                height={500}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
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
