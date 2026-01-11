'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { usePermissions } from '@/hooks/use-permissions'
import { BackToDashboardButton } from '@/app/components/admin-button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { DollarSign, Download, TrendingUp, ShoppingCart, CreditCard, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Transaction {
  id: string
  orderId: string
  paypalOrderId: string
  paypalTransactionId: string
  productId: string
  userId: string
  amount: number
  currency: string
  status: 'completed' | 'failed'
  timestamp: string
  payerEmail?: string
  payerName?: string
}

export default function TransactionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (permissionsLoading || status === 'loading') return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    const isReviewerOnly = permissions?.hasReviewerRole && !permissions?.hasAdminRole && !permissions?.hasModeratorRole
    if (!permissions?.hasAnyStaffRole || isReviewerOnly) {
      router.push('/')
    } else {
      fetchTransactions()
    }
  }, [status, permissions, router, permissionsLoading])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/payments/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
        setFilteredTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTransactions(transactions)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredTransactions(
        transactions.filter(
          t =>
            t.orderId.toLowerCase().includes(term) ||
            t.userId.toLowerCase().includes(term) ||
            t.payerEmail?.toLowerCase().includes(term) ||
            t.productId.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, transactions])

  if (loading || !mounted || permissionsLoading) {
    return <LoadingPage text="Loading transactions..." />
  }

  // Only calculate these on the client after mounting
  if (!mounted) {
    return <LoadingPage text="Loading transactions..." />
  }

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const averageOrderValue = completedTransactions.length > 0 
    ? totalRevenue / completedTransactions.length 
    : 0

  // Group transactions by date for revenue chart
  const revenueByDate = transactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => {
      const date = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += t.amount
      return acc
    }, {} as Record<string, number>)

  const revenueChartData = Object.entries(revenueByDate)
    .map(([date, revenue]) => ({ date, revenue }))
    .slice(-30) // Last 30 days

  // Group transactions by product for pie chart
  const productRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => {
      if (!acc[t.productId]) {
        acc[t.productId] = 0
      }
      acc[t.productId] += t.amount
      return acc
    }, {} as Record<string, number>)

  const productChartData = Object.entries(productRevenue)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 products

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  const stats = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      color: 'text-purple-600',
      icon: DollarSign,
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      label: 'Total Transactions',
      value: transactions.length,
      color: 'text-blue-600',
      icon: ShoppingCart,
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      label: 'Completed',
      value: completedTransactions.length,
      color: 'text-green-600',
      icon: CreditCard,
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      label: 'Average Order Value',
      value: `$${averageOrderValue.toFixed(2)}`,
      color: 'text-orange-600',
      icon: TrendingUp,
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-7xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage all payment transactions</p>
        </div>
        <BackToDashboardButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Revenue Trends
              </CardTitle>
              <CardDescription>Daily revenue over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Products
              </CardTitle>
              <CardDescription>Revenue by product (top 5)</CardDescription>
            </CardHeader>
            <CardContent>
              {productChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `$${(value as number).toFixed(2)}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No product data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by Order ID, User ID, Email, or Product..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:border-primary"
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono">{transaction.orderId}</td>
                      <td className="px-4 py-3 text-sm">{transaction.productId}</td>
                      <td className="px-4 py-3 text-sm font-mono">{transaction.userId}</td>
                      <td className="px-4 py-3 text-sm">{transaction.payerEmail || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${transaction.amount.toFixed(2)} {transaction.currency}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          variant={transaction.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
