'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, GitCompare } from 'lucide-react'
import { BackToDashboardButton } from '@/app/components/admin-button'
import type { Application } from '@/lib/types'
import ProfileCard from '@/app/components/profile-card'

export default function CompareApplications() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [comparisonApps, setComparisonApps] = useState<Application[]>([])

  useEffect(() => {
    if (!permissions?.hasAnyStaffRole) {
      router.push('/')
    } else if (permissions?.hasAnyStaffRole) {
      fetchApplications()
      const ids = searchParams?.get('ids')?.split(',') || []
      if (ids.length > 0 && ids[0] !== '') {
        setSelectedIds(new Set(ids))
      }
    }
  }, [permissions, router, searchParams])

  useEffect(() => {
    if (selectedIds.size > 0) {
      const selected = applications.filter(app => selectedIds.has(app.id))
      setComparisonApps(selected)
    } else {
      setComparisonApps([])
    }
  }, [selectedIds, applications])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      if (newSelected.size < 4) {
        newSelected.add(id)
      } else {
        toast({ title: 'Limit Reached', description: 'You can compare up to 4 applications at once.', variant: 'destructive' })
        return
      }
    }
    setSelectedIds(newSelected)
  }

  const startComparison = () => {
    if (selectedIds.size < 2) {
      toast({ title: 'Invalid Selection', description: 'Please select at least 2 applications to compare.', variant: 'destructive' })
      return
    }
    const ids = Array.from(selectedIds).join(',')
    router.push(`/admin/applications/compare?ids=${ids}`)
  }

  if (!permissions?.hasAnyStaffRole || permissionsLoading) {
    return null
  }

  if (comparisonApps.length >= 2) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 max-w-7xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Application Comparison</h1>
            <p className="text-muted-foreground">Compare {comparisonApps.length} applications side by side</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedIds(new Set())}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Select Different Applications
            </Button>
            <BackToDashboardButton />
            
          </div>
        </div>

        <div className={`grid grid-cols-1 ${comparisonApps.length === 2 ? 'md:grid-cols-2' : comparisonApps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-6`}>
          {comparisonApps.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="text-lg">{app.username}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(app.timestamp).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <ProfileCard profile={app.discord} />
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Age</p>
                    <p>{app.age} years</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Steam ID</p>
                    <p className="font-mono text-xs">{app.steamId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">CFX Account</p>
                    <a href={app.cfxAccount} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs break-all">
                      {app.cfxAccount}
                    </a>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Experience Length</p>
                    <p>{app.experience.length} characters</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Character Length</p>
                    <p>{app.character.length} characters</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href={`/admin/applications?highlight=${app.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Full Application
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Roleplay Experience</h3>
                <div className={`grid ${comparisonApps.length === 2 ? 'grid-cols-2' : comparisonApps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
                  {comparisonApps.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">{app.username}</p>
                      <p className="text-xs text-muted-foreground line-clamp-6">{app.experience}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Character Backstory</h3>
                <div className={`grid ${comparisonApps.length === 2 ? 'grid-cols-2' : comparisonApps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
                  {comparisonApps.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">{app.username}</p>
                      <p className="text-xs text-muted-foreground line-clamp-6">{app.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 max-w-7xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Application Comparison</h1>
          <p className="text-muted-foreground">Select 2-4 applications to compare</p>
        </div>
          <div className="flex gap-2">
            <BackToDashboardButton />
            
          </div>
        </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">{selectedIds.size} selected (max 4)</p>
              <p className="text-sm text-muted-foreground">Select at least 2 applications to compare</p>
            </div>
            <Button onClick={startComparison} disabled={selectedIds.size < 2}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id} className={selectedIds.has(app.id) ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.has(app.id)}
                  onCheckedChange={() => toggleSelection(app.id)}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{app.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(app.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
