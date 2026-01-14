'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { shopConfig, applicationConfig, type ShopProduct } from '@/lib/config'
import { Check, Zap, Package, FileText, User, LogOut, ShoppingBag, Sparkles, Crown, Gift } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, signIn } from 'next-auth/react'
import AdminButton from '@/app/components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

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

export default function PricingPage() {
  const { data: session } = useSession()
  const discordUser = (session as ExtendedSession)?.discord
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<ShopProduct[]>(shopConfig.products)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coins' | 'premium' | 'cosmetic' | 'bundle'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [shopEnabled, setShopEnabled] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    // Fetch latest products and shop settings from API
    const loadProducts = async () => {
      try {
        const [productsRes, settingsRes] = await Promise.all([
          fetch('/api/shop/products'),
          fetch('/api/shop/settings')
        ])
        
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data)
        }
        
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          setShopEnabled(settings.enabled ?? true)
        }
      } catch (error) {
        console.warn('Failed to fetch shop data, using config fallback:', error)
        setProducts(shopConfig.products)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <LoadingPage text="Loading shop..." />
  }

  if (loading) {
    return <LoadingPage text="Loading shop..." />
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Items', icon: '📦' },
    { id: 'coins', label: 'Coins', icon: '💰' },
    { id: 'premium', label: 'Premium', icon: '⭐' },
    { id: 'bundle', label: 'Bundles', icon: '🎁' },
  ] as const

  const handlePurchase = async (productId: string) => {
    if (!session?.user?.email) {
      toast({
        title: 'Not Signed In',
        description: 'Please sign in to make a purchase',
        variant: 'destructive',
      })
      return
    }

    setProcessingId(productId)
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, userId: session.user.email }),
      })

      if (response.ok) {
        const { orderId } = await response.json()
        // Redirect to PayPal
        window.location.href = `/api/payments/approve?orderId=${orderId}`
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create order. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 sticky top-0 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center space-x-3 group">
            <Image src={applicationConfig.website.serverLogo} alt={applicationConfig.website.serverName} width={48} height={48} className="rounded-lg ring-2 ring-white/10 group-hover:ring-violet-500/50 transition-all" />
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">{applicationConfig.website.serverName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/rules" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Rules
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Announcements
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-white transition-colors">
              Shop
            </Link>
            <Link href="/support" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {mounted && discordUser ? (
              <>
                <Link href="/apply">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                    <span className="relative z-10 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Apply
                    </span>
                  </Button>
                </Link>
                <AdminButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-white/10 hover:ring-violet-500/50 transition-all">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined} alt={discordUser.username} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white">{discordUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{discordUser.username}</p>
                        <p className="w-[200px] truncate text-sm text-white/60">{discordUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-white/80 focus:text-white focus:bg-white/10">
                      <Link href="/my-application" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer text-white/80 focus:text-white focus:bg-white/10"
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
                className="relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 0 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 0 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Sign in with Discord
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-7xl py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Premium Shop
          </Badge>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
            Shop & Pricing
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Get coins, premium access, and exclusive cosmetics to enhance your experience
          </p>
        </motion.div>

        {/* Shop Disabled Message */}
        {!shopEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-yellow-500/10 backdrop-blur-xl">
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Shop Currently Unavailable</h3>
                <p className="text-white/70 mb-4">
                  The shop is temporarily disabled. Please check back later or contact an administrator for more information.
                </p>
                <Link href="/">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
                    <span className="relative z-10">Return to Home</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Category Filter */}
        {shopEnabled && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex gap-3 mb-12 overflow-x-auto pb-2 justify-center flex-wrap"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 text-white shadow-xl shadow-violet-500/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700'
                  : 'bg-slate-800/50 text-white/80 hover:text-white hover:bg-slate-800/80 backdrop-blur-sm border border-white/10'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>{cat.icon}</span>
                {cat.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
        )}

        {/* Products Grid */}
        {shopEnabled && (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`group h-full flex flex-col relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20 ${
                  product.highlighted ? 'ring-2 ring-violet-500/50 shadow-2xl shadow-violet-500/30' : ''
                }`}
              >
                {/* Highlighted Badge */}
                {product.highlighted && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 via-blue-600 to-purple-600 text-white px-4 py-1 rounded-bl-lg font-bold shadow-lg z-10">
                    <span className="text-xs flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      BEST VALUE
                    </span>
                  </div>
                )}

                {/* Icon Header */}
                <div className="h-24 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center text-6xl border-b border-white/10 group-hover:from-violet-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                  {product.icon}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-white mb-2">{product.name}</CardTitle>
                      <p className="text-sm text-white/60">{product.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price Section */}
                  <div className="mb-6 pb-6 border-b border-white/10">
                    {(() => {
                      const hasDiscount = !!product.discountPercent && product.discountPercent > 0
                      const discountedPrice = hasDiscount
                        ? product.price * (1 - (product.discountPercent ?? 0) / 100)
                        : product.price

                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                ${discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-white/50">{product.currency}</span>
                            </div>
                            {hasDiscount && (
                              <span className="text-xs font-semibold text-green-300 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                                -{product.discountPercent}%
                              </span>
                            )}
                          </div>

                          {hasDiscount && (
                            <div className="mt-1 text-sm text-white/40 line-through">
                              ${product.price.toFixed(2)}
                            </div>
                          )}

                          {product.bonus && (
                            <div className="mt-2 text-sm text-violet-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              +{product.bonus} {product.category === 'coins' ? 'Bonus Coins' : 'Months Bonus'}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* Features List */}
                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {product.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchase(product.id)}
                    disabled={processingId === product.id || !shopConfig.paypal.enabled || !session?.user}
                    className="relative overflow-hidden w-full bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 hover:from-violet-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold py-6 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
                    size="lg"
                  >
                    <span className="relative z-10">
                    {(() => {
                      const hasDiscount = !!product.discountPercent && product.discountPercent > 0
                      const discountedPrice = hasDiscount
                        ? product.price * (1 - (product.discountPercent ?? 0) / 100)
                        : product.price

                      if (processingId === product.id) {
                        return (
                          <span className="flex items-center gap-2 justify-center">
                            <span className="animate-spin">⏳</span>
                            Processing...
                          </span>
                        )
                      }

                      if (!shopConfig.paypal.enabled) {
                        return 'PayPal Not Configured'
                      }

                      if (session?.user) {
                        return (
                          <span className="flex items-center gap-2 justify-center">
                            <ShoppingBag className="w-5 h-5" />
                            Buy Now - ${discountedPrice.toFixed(2)}
                          </span>
                        )
                      }

                      return 'Sign In to Purchase'
                    })()}
                    </span>
                  </Button>

                  {!session?.user && (
                    <Link href="/api/auth/signin" className="w-full mt-2">
                      <Button variant="outline" className="w-full bg-slate-800/50 border-white/10 text-white/80 hover:text-white hover:bg-slate-800/80">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        )}

        {/* Empty State */}
        {shopEnabled && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Package className="h-16 w-16 text-white/20 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Products Available</h3>
            <p className="text-white/60">Check back later for new items in this category</p>
          </motion.div>
        )}

        {/* Info Section */}
        {shopEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Instant Delivery</h3>
              <p className="text-sm text-white/60">Items delivered immediately after payment confirmation</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Secure Payments</h3>
              <p className="text-sm text-white/60">All transactions secured with PayPal protection</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 backdrop-blur-xl hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Support</h3>
              <p className="text-sm text-white/60">24/7 customer support for all purchases</p>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Payment Notice */}
        {shopEnabled && !shopConfig.paypal.enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-sm"
          >
            <p className="text-sm text-yellow-300">
              ⚠️ PayPal integration is not configured. Please contact an administrator to set up payments.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
