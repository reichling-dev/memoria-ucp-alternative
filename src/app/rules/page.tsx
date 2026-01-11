 'use client'

import React, { useEffect, useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, User, LogOut, Shield, Users, Target, Truck, Home } from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import { applicationConfig } from '@/lib/config'
import { usePermissions } from '@/hooks/use-permissions'
import AdminButton from '../components/admin-button'
import Image from 'next/image'
import { LoadingPage } from '@/components/ui/loading-spinner'


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

interface RuleCategory {
  id: string
  title: string
  rules: string[]
}

export default function Rules() {
  const { data: session } = useSession()
  const { permissions } = usePermissions()
  const discordUser = (session as ExtendedSession)?.discord
  const userCanManageRules = permissions.canManageRules

  const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/rules')
        if (!res.ok) throw new Error('Failed to fetch rules')
        const data = await res.json()
        // Support stored format { categories: [...] } or direct array
        const categories = data?.categories ?? data
        if (mounted) {
          setRuleCategories(categories)
          setIsLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (mounted) setIsLoading(false)
      }
    }
    fetchRules()
    return () => {
      mounted = false
    }
  }, [])

  // Editing state for admins
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [editableCategories, setEditableCategories] = useState<RuleCategory[]>([])

  useEffect(() => {
    // initialize editable copy when categories load
    if (ruleCategories && ruleCategories.length) {
      setEditableCategories(JSON.parse(JSON.stringify(ruleCategories)))
    }
  }, [ruleCategories])

  const categoryConfigs: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, hoverColor: string }> = {
    general: { icon: Shield, color: 'from-blue-500/10 to-blue-600/10', hoverColor: 'hover:from-blue-500/20 hover:to-blue-600/20' },
    roleplay: { icon: Users, color: 'from-green-500/10 to-green-600/10', hoverColor: 'hover:from-green-500/20 hover:to-green-600/20' },
    combat: { icon: Target, color: 'from-red-500/10 to-red-600/10', hoverColor: 'hover:from-red-500/20 hover:to-red-600/20' },
    vehicles: { icon: Truck, color: 'from-yellow-500/10 to-yellow-600/10', hoverColor: 'hover:from-yellow-500/20 hover:to-yellow-600/20' },
    property: { icon: Home, color: 'from-purple-500/10 to-purple-600/10', hoverColor: 'hover:from-purple-500/20 hover:to-purple-600/20' },
  }

  function toggleEdit(catId: string) {
    setEditing((s) => ({ ...s, [catId]: !s[catId] }))
  }

  function updateEditableTitle(catId: string, value: string) {
    setEditableCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, title: value } : c)))
  }

  function updateEditableRule(catId: string, idx: number, value: string) {
    setEditableCategories((prev) => prev.map((c) => {
      if (c.id !== catId) return c
      const copy: RuleCategory = { ...c, rules: [...c.rules] }
      copy.rules[idx] = value
      return copy
    }))
  }

  function addEditableRule(catId: string) {
    setEditableCategories((prev) => prev.map((c) => c.id === catId ? { ...c, rules: [...c.rules, 'New rule...'] } : c))
  }

  function removeEditableRule(catId: string, idx: number) {
    setEditableCategories((prev) => prev.map((c) => {
      if (c.id !== catId) return c
      const copy: RuleCategory = { ...c, rules: c.rules.filter((_: string, i: number) => i !== idx) }
      return copy
    }))
  }

  if (isLoading) {
    return <LoadingPage text="Loading rules..." />
  }

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
            <Link href="/rules" className="text-sm font-medium text-foreground">
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
            Server Rules
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Our comprehensive rules ensure a fair, enjoyable, and immersive roleplay experience for all players. Please read carefully and respect these guidelines.
          </p>
        </div>
      </section>

      {/* Rules Categories */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {ruleCategories.map((category) => {
            const config = categoryConfigs[category.id] || { icon: FileText, color: 'from-gray-500/10 to-gray-600/10', hoverColor: 'hover:from-gray-500/20 hover:to-gray-600/20' }
            const IconComponent = config.icon
            const isEditing = !!editing[category.id]
            const editable = editableCategories.find((c: RuleCategory) => c.id === category.id) || category
            return (
              <Card key={category.id} className={`border-0 bg-gradient-to-br ${config.color} ${config.hoverColor} transition-all duration-300 hover:shadow-lg`}>
                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {userCanManageRules && (
                      <div className="absolute top-6 right-6">
                        <Button size="sm" onClick={() => toggleEdit(category.id)}>{isEditing ? 'Cancel' : 'Edit'}</Button>
                      </div>
                    )}
                    {isEditing ? (
                      <input value={editable.title} onChange={(e) => updateEditableTitle(category.id, e.target.value)} className="text-3xl font-bold bg-transparent border-b border-dashed focus:outline-none" />
                    ) : (
                      <CardTitle className="text-3xl font-bold">{category.title}</CardTitle>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    { (isEditing ? editable.rules : category.rules).map((rule: string, ruleIndex: number) => (
                      <div key={ruleIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-semibold text-primary">
                            {ruleIndex + 1}
                          </span>
                        </div>
                        {isEditing ? (
                          <div className="flex-1">
                            <textarea className="w-full bg-transparent border rounded p-2" value={rule} onChange={(e) => updateEditableRule(category.id, ruleIndex, e.target.value)} />
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" onClick={() => removeEditableRule(category.id, ruleIndex)} variant="destructive">Remove</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">{rule}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="mt-4 flex items-center gap-2">
                      <Button onClick={() => addEditableRule(category.id)}>Add Rule</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Important Notice */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <Card className="border-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Shield className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Important Notice</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              These rules are subject to change at any time. It is your responsibility to stay updated with the latest rules and guidelines.
              Violation of these rules may result in warnings, temporary bans, or permanent bans depending on the severity of the offense.
              Staff decisions are final and appeals can be submitted through the appropriate channels.
            </p>
            <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                Last updated: January 11, 2026
              </p>
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