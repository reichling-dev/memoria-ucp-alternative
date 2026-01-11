'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '../../../../components/ui/switch'
import Link from 'next/link'

interface AppTypeItem {
  id: string
  name: string
  cooldownDays: number
  uniqueApproved: boolean
  allowMultiplePending: boolean
  fields?: FieldDef[]
}

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox'

interface FieldDef {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
}

export default function ApplicationTypesPage() {
  const { status } = useSession()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const [types, setTypes] = useState<AppTypeItem[]>([])
  const [form, setForm] = useState<AppTypeItem>({ id: '', name: '', cooldownDays: 0, uniqueApproved: false, allowMultiplePending: false, fields: [] })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (status === 'loading' || permissionsLoading) return
    if (status !== 'authenticated') { router.push('/'); return }
    // Wait until roles are loaded to avoid premature redirect
    if (!permissions?.roles || (permissions.roles.length === 0 && !permissions.hasAnyStaffRole)) {
      return
    }
    if (!permissions?.hasAnyStaffRole) { router.push('/'); return }
    fetchTypes()
  }, [status, permissions, permissionsLoading, router])

  const fetchTypes = async () => {
    const res = await fetch('/api/admin/application-types')
    if (res.ok) setTypes(await res.json())
  }

  const submit = async () => {
    const method = editing ? 'PUT' : 'POST'
    const payload = { ...form, fields: form.fields || [] }
    const res = await fetch('/api/admin/application-types', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { setForm({ id: '', name: '', cooldownDays: 0, uniqueApproved: false, allowMultiplePending: false, fields: [] }); setEditing(false); fetchTypes() }
  }

  const edit = (t: AppTypeItem) => { setForm({ ...t, fields: t.fields || [] }); setEditing(true) }
  const del = async (id: string) => { if (!confirm('Delete type?')) return; const res = await fetch(`/api/admin/application-types?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchTypes() }

  const addField = () => {
    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), { id: '', label: '', type: 'text', required: false }]
    }))
  }

  const updateField = (index: number, patch: Partial<FieldDef>) => {
    setForm(prev => {
      const fields = [...(prev.fields || [])]
      fields[index] = { ...fields[index], ...patch }
      return { ...prev, fields }
    })
  }

  const removeField = (index: number) => {
    setForm(prev => {
      const fields = [...(prev.fields || [])]
      fields.splice(index, 1)
      return { ...prev, fields }
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Application Types</h1>
          <p className="text-muted-foreground">Control what players can apply for and the rules</p>
        </div>
        <Link href="/admin/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-white !text-black !border-gray-300 hover:!bg-gray-100"
          >
            Admin Dashboard
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{editing ? 'Edit Type' : 'Create Type'}</h2>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">ID</label>
            <Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="e.g. whitelist" disabled={editing} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Display name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cooldown Days</label>
            <Input type="number" value={form.cooldownDays} onChange={e => setForm({ ...form, cooldownDays: parseInt(e.target.value || '0') })} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.uniqueApproved} onCheckedChange={(v: boolean) => setForm({ ...form, uniqueApproved: v })} />
            <span>Block new applications if approved already</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.allowMultiplePending} onCheckedChange={(v: boolean) => setForm({ ...form, allowMultiplePending: v })} />
            <span>Allow multiple pending at once</span>
          </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Fields</h3>
              <Button size="sm" variant="outline" onClick={addField}>Add Field</Button>
            </div>
            {(form.fields || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No fields yet. Click &quot;Add Field&quot; to create one.</p>
            ) : (
              <div className="space-y-4">
                {(form.fields || []).map((f, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-12 items-end p-3 border rounded-md">
                    <div className="sm:col-span-3">
                      <label className="text-xs font-medium mb-1 block">Field ID</label>
                      <Input value={f.id} onChange={e => updateField(idx, { id: e.target.value })} placeholder="unique_key" />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-xs font-medium mb-1 block">Label</label>
                      <Input value={f.label} onChange={e => updateField(idx, { label: e.target.value })} placeholder="Full Name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block">Type</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={f.type}
                        onChange={e => updateField(idx, { type: e.target.value as FieldType })}
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <Switch checked={!!f.required} onCheckedChange={(v: boolean) => updateField(idx, { required: v })} />
                      <span className="text-sm">Required</span>
                    </div>
                    {f.type === 'select' && (
                      <div className="sm:col-span-9">
                        <label className="text-xs font-medium mb-1 block">Options (comma-separated)</label>
                        <Input
                          value={(f.options || []).join(', ')}
                          onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="Option 1, Option 2"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-1 flex justify-end">
                      <Button size="sm" variant="destructive" onClick={() => removeField(idx)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={submit}>{editing ? 'Update' : 'Create'}</Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(false); setForm({ id: '', name: '', cooldownDays: 0, uniqueApproved: false, allowMultiplePending: false, fields: [] }) }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {types.map(t => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <div className="text-xs text-muted-foreground">{t.id}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Cooldown: {t.cooldownDays} days</div>
              <div className="text-sm text-muted-foreground">Unique Approved: {t.uniqueApproved ? 'Yes' : 'No'}</div>
              <div className="text-sm text-muted-foreground">Multiple Pending: {t.allowMultiplePending ? 'Yes' : 'No'}</div>
              <div className="text-sm text-muted-foreground mt-1">Fields: {t.fields?.length || 0}</div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => edit(t)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => del(t.id)} disabled={['whitelist','police','ems','sheriff'].includes(t.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
