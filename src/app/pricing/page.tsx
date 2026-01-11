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
import { Check, Zap, Package, FileText, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, signIn } from 'next-auth/react'
import AdminButton from '@/app/components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    // Fetch latest products from API, fallback to config
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/shop/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } catch (error) {
        console.warn('Failed to fetch products, using config fallback:', error)
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
                        <Link href="/pricing" className="text-sm font-medium text-foreground transition-colors">
              Shop
            </Link>
                        <Link href="/support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Support
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
                Sign in with Discord
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-12 mt-8">
          <h1 className="text-5xl font-bold tracking-tight mb-2">Shop & Pricing</h1>
          <p className="text-lg text-muted-foreground">Get coins, premium access, and exclusive cosmetics</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                className={`h-full flex flex-col relative overflow-hidden transition-all hover:shadow-lg ${
                  product.highlighted ? 'border-primary/50 shadow-lg' : ''
                }`}
              >
                {/* Highlighted Badge */}
                {product.highlighted && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/50 text-primary-foreground px-4 py-1 rounded-bl-lg">
                    <span className="text-xs font-bold">BEST VALUE</span>
                  </div>
                )}

                {/* Icon Header */}
                <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center text-5xl">
                  {product.icon}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price Section */}
                  <div className="mb-6 pb-6 border-b">
                    {(() => {
                      const hasDiscount = !!product.discountPercent && product.discountPercent > 0
                      const discountedPrice = hasDiscount
                        ? product.price * (1 - (product.discountPercent ?? 0) / 100)
                        : product.price

                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-primary">
                                ${discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-muted-foreground">{product.currency}</span>
                            </div>
                            {hasDiscount && (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 dark:text-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                -{product.discountPercent}%
                              </span>
                            )}
                          </div>

                          {hasDiscount && (
                            <div className="mt-1 text-sm text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </div>
                          )}

                          {product.bonus && (
                            <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                              ✨ +{product.bonus} {product.category === 'coins' ? 'Bonus Coins' : 'Months Bonus'}
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
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchase(product.id)}
                    disabled={processingId === product.id || !shopConfig.paypal.enabled || !session?.user}
                    className="w-full"
                    size="lg"
                  >
                    {(() => {
                      const hasDiscount = !!product.discountPercent && product.discountPercent > 0
                      const discountedPrice = hasDiscount
                        ? product.price * (1 - (product.discountPercent ?? 0) / 100)
                        : product.price

                      if (processingId === product.id) {
                        return (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Processing...
                          </span>
                        )
                      }

                      if (!shopConfig.paypal.enabled) {
                        return 'PayPal Not Configured'
                      }

                      if (session?.user) {
                        return `Buy Now - $${discountedPrice.toFixed(2)}`
                      }

                      return 'Sign In to Purchase'
                    })()}
                  </Button>

                  {!session?.user && (
                    <Link href="/api/auth/signin" className="w-full mt-2">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Products Available</h3>
            <p className="text-muted-foreground">Check back later for new items in this category</p>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card>
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Instant Delivery</h3>
              <p className="text-sm text-muted-foreground">Items delivered immediately after payment confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Check className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">All transactions secured with PayPal protection</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Package className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Support</h3>
              <p className="text-sm text-muted-foreground">24/7 customer support for all purchases</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Notice */}
        {!shopConfig.paypal.enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ PayPal integration is not configured. Please contact an administrator to set up payments.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
