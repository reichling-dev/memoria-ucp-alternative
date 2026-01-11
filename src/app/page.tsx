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
const ServerStatusCard = dynamic(() => import('./components/server-status-card'), {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Announcement Modal */}
      {mounted && (
        <Dialog open={showAnnouncementModal && !!currentAnnouncement} onOpenChange={setShowAnnouncementModal}>
          <DialogContent className="max-w-2xl">
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
                    <Badge variant="outline" className="capitalize">
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
                onClick={() => {
                  if (currentAnnouncement) {
                    handleDismissAnnouncement(currentAnnouncement.id)
                  }
                }}
              >
                Don&apos;t Show Again
              </Button>
              <Link href="/announcements">
                <Button onClick={() => setShowAnnouncementModal(false)}>
                  View All Announcements
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={40} height={40} className="rounded-lg" priority />
            <span className="text-2xl font-bold">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                Home
              </Button>
            </Link>
            <Link href="/rules">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                Rules
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                About
              </Button>
            </Link>
            <Link href="/announcements">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                Announcements
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                Shop
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="ghost" className="text-sm font-medium text-white hover:bg-white/10">
                Support
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {mounted && discordUser ? (
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
            ) : mounted ? (
              <Button
                onClick={() => signIn('discord')}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="container relative z-10 mx-auto max-w-5xl text-center">

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            {applicationConfig.website.headerTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {applicationConfig.website.headerSubtitle}
          </p>
          <div className="mt-10 flex justify-center">
            <ServerStatusCard className="w-full max-w-md" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/Bulb.svg" alt="Character Creation" width={32} height={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Character Creation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Create detailed characters with custom appearances, backgrounds, and personalities. Build your story from the ground up in our immersive roleplay world.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 hover:from-purple-500/10 hover:to-purple-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/Puzzle.svg" alt="Realistic RP" width={32} height={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Realistic Roleplay</h2>
              <p className="text-muted-foreground leading-relaxed">
                Experience authentic roleplay mechanics with dynamic weather, day/night cycles, and realistic vehicle handling that brings Los Santos to life.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/Calender.svg" alt="Economy System" width={32} height={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Dynamic Economy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Participate in a living economy with jobs, businesses, and market fluctuations. Build wealth through legitimate means or take risks in the underground.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-green-500/5 to-green-600/5 hover:from-green-500/10 hover:to-green-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/shield.svg" alt="Community" width={32} height={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Active Community</h2>
              <p className="text-muted-foreground leading-relaxed">
                Join a dedicated community of roleplayers who respect the craft. Regular events, storylines, and collaborative storytelling make every session memorable.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/car-sideview.svg" alt="Play" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">How to play FiveM</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Learn the basics of getting started with our FiveM server.</p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 hover:from-purple-500/10 hover:to-purple-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/mountains.svg" alt="What is FiveM" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">What is FiveM?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Discover what makes FiveM the ultimate GTA V multiplayer experience.</p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 hover:from-cyan-500/10 hover:to-cyan-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/car-sideview.svg" alt="Connect" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">How to connect</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Step-by-step guide to joining our server.</p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-pink-500/5 to-pink-600/5 hover:from-pink-500/10 hover:to-pink-600/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 mx-auto mb-6 transition-all duration-300 group-hover:scale-110">
                <Image src="/images/mountains.svg" alt="Fun" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Will you have fun?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Absolutely! Join our amazing community today.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Server Showcase
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the stunning visuals and immersive environments of our FiveM server
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Main Slider */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={sliderImages[currentIndex]}
                  alt={`FiveM Server Scene ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                  loading="lazy"
                  quality={85}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 hover:scale-110"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-300 hover:scale-110"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary scale-125'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="text-center mt-4">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {sliderImages.length}
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Your website can stand out, or not, you decide.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our exclusive roleplay server and start your journey today. Experience the best FiveM has to offer with our professional community.
            </p>
            <Link href="/apply">
              <Button size="lg" className="text-lg px-8 py-6">
                <FileText className="mr-2 h-5 w-5" />
                Ready to start playing?
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              <Image
                src="/images/index/vertical2.jpg"
                alt="FiveM Server"
                width={400}
                height={500}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
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
