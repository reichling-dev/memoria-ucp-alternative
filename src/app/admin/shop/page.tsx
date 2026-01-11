'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePermissions } from '@/hooks/use-permissions'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { ShopProduct } from '@/lib/config'
import { DollarSign, Edit, PlusCircle, Trash2, ShoppingBag, RefreshCw, Shield } from 'lucide-react'

const defaultProduct: ShopProduct = {
  id: '',
  name: '',
  description: '',
  price: 0,
  currency: 'USD',
  icon: '🛒',
  category: 'coins',
  features: [],
}

export default function AdminShopPage() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coins' | 'premium' | 'cosmetic' | 'bundle'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ShopProduct | null>(null)
  const [form, setForm] = useState<ShopProduct>(defaultProduct)
  const [saving, setSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/shop/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Guard non-admins
  useEffect(() => {
    if (permissionsLoading || status === 'loading') return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAdminRole)) return
    if (!permissions?.hasAdminRole) {
      router.push('/')
    } else {
      fetchProducts()
    }
  }, [status, permissions, permissionsLoading, router, fetchProducts])

  const resetForm = () => {
    setForm(defaultProduct)
    setEditing(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = {
        ...form,
        id: editing?.id || form.id || undefined,
        features: form.features || [],
      }
      const res = await fetch('/api/shop/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' })
        return
      }

      toast({ title: editing ? 'Product updated' : 'Product created' })
      await fetchProducts()
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Unable to save product', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: ShopProduct) => {
    setEditing(product)
    setForm({
      ...product,
      features: product.features || [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      const res = await fetch('/api/shop/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' })
        return
      }
      toast({ title: 'Product deleted' })
      await fetchProducts()
    } catch (error) {
      console.error('Delete error:', error)
      toast({ title: 'Error', description: 'Unable to delete product', variant: 'destructive' })
    }
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => (selectedCategory === 'all' ? true : p.category === selectedCategory))
      .filter(p =>
        search.trim() === ''
          ? true
          : p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase())
      )
  }, [products, search, selectedCategory])

  if (loading || permissionsLoading) {
    return <LoadingPage text="Loading shop manager..." />
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto p-4 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> Shop Manager
          </h1>
          <p className="text-muted-foreground">Create, edit, and remove shop packages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" /> Admin access required
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {editing ? 'Edit Product' : 'Create Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">ID (optional)</Label>
            <Input id="id" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="auto-generated if empty" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Price</Label>
            <div className="flex gap-2">
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value as ShopProduct['currency'] })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as ShopProduct['category'] })}
            >
              <option value="coins">Coins</option>
              <option value="premium">Premium</option>
              <option value="cosmetic">Cosmetic</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Icon (emoji)</Label>
            <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={4} />
          </div>

          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Bonus (optional)</Label>
            <Input type="number" min="0" value={form.bonus ?? ''} onChange={e => setForm({ ...form, bonus: e.target.value ? Number(e.target.value) : undefined })} />
          </div>

          <div className="space-y-2">
            <Label>Discount % (optional)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.discountPercent ?? ''}
              onChange={e => setForm({ ...form, discountPercent: e.target.value ? Number(e.target.value) : undefined })}
            />
            <p className="text-xs text-muted-foreground">Applied to display and checkout price</p>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="highlighted"
              checked={!!form.highlighted}
              onCheckedChange={checked => setForm({ ...form, highlighted: Boolean(checked) })}
            />
            <Label htmlFor="highlighted">Highlight as best value</Label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Features (one per line)</Label>
            <Textarea
              value={(form.features || []).join('\n')}
              onChange={e => setForm({ ...form, features: e.target.value.split('\n').map(line => line.trim()).filter(Boolean) })}
              rows={4}
            />
          </div>

          <div className="flex gap-2 md:col-span-2 justify-end">
            <Button variant="outline" onClick={resetForm} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || form.price <= 0}>
              <DollarSign className="h-4 w-4 mr-1" /> {editing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'coins', 'premium', 'cosmetic', 'bundle'] as const).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="md:w-64"
        />
      </div>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No products found</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`h-full flex flex-col ${product.highlighted ? 'border-primary/50 shadow-lg' : ''}`}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-xl">{product.icon}</span>
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  {product.highlighted && (
                    <Badge variant="secondary">Highlighted</Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    {product.discountPercent ? (
                      <>
                        <span className="line-through text-muted-foreground/70">${product.price.toFixed(2)}</span>
                        <span>
                          ${ (product.price * (1 - product.discountPercent / 100)).toFixed(2) } {product.currency}
                        </span>
                        <Badge variant="secondary">-{product.discountPercent}%</Badge>
                      </>
                    ) : (
                      <span>${product.price.toFixed(2)} {product.currency}</span>
                    )}
                    {product.bonus !== undefined && (
                      <Badge variant="outline">Bonus: {product.bonus}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground capitalize">
                    <Badge variant="outline">{product.category}</Badge>
                    {product.features?.length ? <Badge variant="secondary">{product.features.length} features</Badge> : null}
                  </div>
                  {product.features?.length ? (
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {product.features.slice(0, 4).map(feature => (
                        <li key={feature}>{feature}</li>
                      ))}
                      {product.features.length > 4 && <li className="text-xs">+{product.features.length - 4} more</li>}
                    </ul>
                  ) : null}

                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
