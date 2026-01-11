'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePermissions } from '@/hooks/use-permissions'

// Prefill using the same defaults used in src/app/rules/page.tsx
const defaultCategories = [
  {
    id: 'general',
    title: 'General Rules',
    rules: [
      'Respect all players and staff members at all times.',
      'No harassment, discrimination, or hate speech of any kind.',
      'Do not spam chat, voice chat, or any other communication channels.',
      'English is the primary language. Use appropriate channels for other languages.',
      'Do not advertise other servers or communities.',
      'Keep all content appropriate and family-friendly.',
      'Report bugs and exploits to staff instead of abusing them.',
      'Do not impersonate staff members or other players.'
    ]
  },
  {
    id: 'roleplay',
    title: 'Roleplay Rules',
    rules: [
      'Stay in character at all times while in-game.',
      'Powergaming and metagaming are strictly prohibited.',
      'Value of Life (VoL) must be respected in all situations.',
      'No random deathmatching or revenge killing.',
      'Fear roleplay must be taken seriously.',
      'Use /me and /do commands appropriately for actions.',
      'Character names must be realistic and appropriate.',
      'No mixing OOC (Out of Character) information with IC (In Character) situations.'
    ]
  },
  {
    id: 'combat',
    title: 'Combat Rules',
    rules: [
      'No drive-by shootings without proper roleplay buildup.',
      'Weapon usage must follow realistic roleplay scenarios.',
      'No camping in safe zones or spawn areas.',
      'Proper initiation of combat is required.',
      'No ghosting or leaving combat without consequences.',
      'Medical roleplay must be respected during injuries.',
      'No combat logging during active situations.',
      'Weapon skins and modifications must be roleplayed appropriately.'
    ]
  },
  {
    id: 'vehicles',
    title: 'Vehicle Rules',
    rules: [
      'Vehicles must be roleplayed realistically.',
      'No reckless driving or dangerous maneuvers without RP.',
      'Proper parking and vehicle storage is required.',
      'No vehicle theft without proper roleplay buildup.',
      'Emergency vehicles require appropriate roleplay.',
      'Vehicle modifications must be purchased legitimately.',
      'No blocking roads or important areas.',
      'Speed limits and traffic laws must be observed.'
    ]
  },
  {
    id: 'property',
    title: 'Property Rules',
    rules: [
      'Respect all property ownership and boundaries.',
      'No raiding without proper warrants or roleplay buildup.',
      'Property damage must be roleplayed appropriately.',
      'No trespassing on private property.',
      'Business ownership and operations must be legitimate.',
      'Property taxes and fees must be paid on time.',
      'No exploiting property mechanics or glitches.',
      'Property customization must follow server guidelines.'
    ]
  }
]

export default function AdminRulesCreator() {
  const { status } = useSession()
  const { permissions } = usePermissions()
  const router = useRouter()
  const [categories, setCategories] = useState(defaultCategories)

  useEffect(() => {
    if (status === 'loading' || !permissions) return
    if (status !== 'authenticated') {
      router.push('/')
      return
    }
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) return
    const isReviewerOnly = permissions?.hasReviewerRole && !permissions?.hasAdminRole && !permissions?.hasModeratorRole
    if (!permissions?.hasAnyStaffRole || isReviewerOnly) {
      router.push('/')
    } else {
      fetchRules()
    }
  }, [status, permissions, router])

  const fetchRules = () => {
    fetch('/api/rules')
      .then(res => res.json())
      .then(data => {
        const cats = data.categories || data
        setCategories(cats)
      })
      .catch(err => console.error(err))
  }

  const [editing, setEditing] = useState<Record<string, boolean>>({})

  function toggleEdit(catId: string) {
    setEditing(s => ({ ...s, [catId]: !s[catId] }))
  }

  function updateCategoryTitle(index: number, value: string) {
    const copy = [...categories]
    copy[index].title = value
    setCategories(copy)
  }

  function updateRuleText(catIndex: number, ruleIndex: number, value: string) {
    const copy = [...categories]
    copy[catIndex].rules[ruleIndex] = value
    setCategories(copy)
  }

  function addRule(catIndex: number) {
    const copy = [...categories]
    copy[catIndex].rules.push('New rule...')
    setCategories(copy)
  }

  function removeRule(catIndex: number, ruleIndex: number) {
    const copy = [...categories]
    copy[catIndex].rules.splice(ruleIndex, 1)
    setCategories(copy)
  }

  async function saveRules() {
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      })
      if (!res.ok) throw new Error('Save failed')
      alert('Rules saved')
    } catch (err) {
      console.error(err)
      alert('Failed to save rules')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Rules Creator</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard">
            <Button>Dashboard</Button>
          </Link>
          <Button onClick={saveRules}>Save Rules</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((cat, ci) => (
          <Card key={cat.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editing[cat.id] ? (
                    <Input value={cat.title} onChange={(e) => updateCategoryTitle(ci, e.target.value)} />
                  ) : (
                    cat.title
                  )}
                </CardTitle>
                <Button size="sm" onClick={() => toggleEdit(cat.id)}>{editing[cat.id] ? 'Cancel' : 'Edit'}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editing[cat.id] ? (
                  <>
                    {cat.rules.map((rule, ri) => (
                      <div key={ri} className="flex items-start gap-2">
                        <Textarea value={rule} onChange={(e) => updateRuleText(ci, ri, e.target.value)} className="flex-1" />
                        <Button variant="destructive" size="sm" className="flex-shrink-0 mt-1" onClick={() => removeRule(ci, ri)}>Remove</Button>
                      </div>
                    ))}
                    <div>
                      <Button onClick={() => addRule(ci)}>Add Rule</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {cat.rules.map((rule, ri) => (
                      <p key={ri} className="text-sm">{ri + 1}. {rule}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
