'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import AuthButton from './auth-button'

import ProfileCard from './profile-card'
import { motion, AnimatePresence } from 'framer-motion'
import { applicationConfig, getMinimumAge } from '@/lib/config'
import { isUserBanned, isUserBlacklisted } from '@/lib/utils'

interface DiscordUser {
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

//

const generateFormSchema = () => {
  const schema: Record<string, z.ZodType> = {}

  applicationConfig.sections.forEach(section => {
    section.fields.forEach(field => {
      let fieldSchema: z.ZodType

      switch (field.type) {
        case 'text':
          fieldSchema = z.string()
          if (field.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.minLength, field.validationMessage)
          }
          if (field.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.pattern), field.validationMessage)
          }
          break
        case 'number':
          fieldSchema = z.number().min(getMinimumAge(), applicationConfig.messages.ageRequirement)
          break
        case 'url':
          fieldSchema = z.string().url(field.validationMessage)
          break
        case 'textarea':
          fieldSchema = z.string()
          if (field.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.minLength, field.validationMessage)
          }
          break
        default:
          fieldSchema = z.string()
      }

      schema[field.name] = field.required ? fieldSchema : fieldSchema.optional()
    })
  })

  return z.object(schema)
}

const formSchema = generateFormSchema()

const generateDefaultValues = () => {
  const defaults: Record<string, string | number> = {}
  applicationConfig.sections.forEach(section => {
    section.fields.forEach(field => {
      defaults[field.name] = field.type === 'number' ? getMinimumAge() : ''
    })
  })
  return defaults
}

const CharacterCount = ({ current, required }: { current: number; required: number }) => (
  <span className={current >= required ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
    {current}/{required}
  </span>
)

const FormSection = ({
  section,
  form,
  delay
}: {
  section: typeof applicationConfig.sections[0]
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
      </svg>
      <h3 className="text-lg font-semibold">{section.title}</h3>
    </div>

    {section.id === 'personal' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    className="bg-background"
                    {...formField}
                    onChange={(e) => field.type === 'number'
                      ? formField.onChange(e.target.value ? parseInt(e.target.value, 10) : '')
                      : formField.onChange(e)
                    }
                  />
                </FormControl>
                <FormDescription className="text-xs">{field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}

    {section.id === 'auth' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {section.fields.map((field, index) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder}
                    className={index === 0 ? "bg-background font-mono text-sm" : "bg-background text-sm"}
                    {...formField}
                  />
                </FormControl>
                <FormDescription className="text-xs">{field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}

    {section.id === 'roleplay' && (
      <div className="space-y-6">
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder}
                    className="min-h-[120px] bg-background resize-none"
                    {...formField}
                  />
                </FormControl>
                <FormDescription className="text-xs flex justify-between">
                  <span>{field.description}</span>
                  <CharacterCount current={formField.value.length} required={field.minLength || 0} />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}
  </motion.div>
)

export default function WhitelistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [reapplyInfo, setReapplyInfo] = useState<{ canReapply: boolean, daysRemaining?: number, message?: string } | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<z.infer<typeof formSchema> | null>(null)
  
  const [appTypes, setAppTypes] = useState<Array<{ id: string; name: string; fields?: Array<{ id: string; label: string; type: 'text'|'textarea'|'number'|'select'|'checkbox'; required: boolean; options?: string[] }> }>>([])
  const [selectedType, setSelectedType] = useState<string>('whitelist')
  const [customValues, setCustomValues] = useState<Record<string, any>>({})
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({})
  const { data: session } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    try {
      const response = await fetch('/api/admin/application-types')
      if (response.ok) {
        const list: Array<{ id: string; name: string; fields?: any[] }> = await response.json()
        setAppTypes(list || [])
        if ((list || []).length > 0) setSelectedType(list[0].id)
      }
    } catch {
      console.error('Failed to fetch application types')
    }
  }

    
  useEffect(() => {
    // Check re-application eligibility when session loads
    const checkReapply = async () => {
      if ((session as ExtendedSession)?.discord?.id) {
        try {
          const response = await fetch(`/api/applications/reapply?type=${encodeURIComponent(selectedType)}`)
          if (response.ok) {
            const data = await response.json()
            setReapplyInfo(data)
          }
        } catch {
          console.error('Failed to check reapply eligibility')
        }
      }
    }
    if (mounted) {
      checkReapply()
    }
  }, [session, mounted, selectedType])

  // Reset custom values when type changes
  useEffect(() => {
    const type = appTypes.find(t => t.id === selectedType)
    const initial: Record<string, any> = {}
    ;(type?.fields || []).forEach(f => {
      if (f.type === 'checkbox') initial[f.id] = false
      else initial[f.id] = ''
    })
    setCustomValues(initial)
    setCustomErrors({})
  }, [selectedType, appTypes])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(),
  })

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if ((session as ExtendedSession)?.discord?.id) {
        try {
          const response = await fetch('/api/applications/drafts')
          if (response.ok) {
            const draft = await response.json()
            if (draft && draft.formData) {
              form.reset(draft.formData)
              setLastSaved(new Date(draft.updatedAt))
              toast({
                title: 'Draft Loaded',
                description: 'Your previously saved draft has been restored.',
              })
            }
          }
        } catch {
          console.error('Failed to load draft')
        }
      }
    }
    if (mounted && session) {
      loadDraft()
    }
  }, [mounted, session, form, toast])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!(session as ExtendedSession)?.discord?.id) return

    const saveDraft = async () => {
      const values = form.getValues()
      // Only save if form has some data
      const hasData = Object.values(values).some(v => v && v !== '' && v !== generateDefaultValues()[Object.keys(values)[0]])
      
      if (!hasData) return

      try {
        const response = await fetch('/api/applications/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: values, custom: customValues, selectedType }),
        })
        if (response.ok) {
          setLastSaved(new Date())
        }
      } catch {
        console.error('Failed to save draft')
      }
    }

    const interval = setInterval(saveDraft, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [session, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Show preview instead of immediate submit
    // Validate custom required fields
    const type = appTypes.find(t => t.id === selectedType)
    const errs: Record<string, string> = {}
    ;(type?.fields || []).forEach(f => {
      if (f.required) {
        const val = customValues[f.id]
        const empty = f.type === 'checkbox' ? false : (val === undefined || val === null || String(val).trim() === '')
        if (empty) errs[f.id] = `${f.label} is required`
      }
    })
    setCustomErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast({ title: 'Missing Information', description: 'Please fill all required fields.', variant: 'destructive' })
      return
    }

    setPreviewData(values)
    setShowPreview(true)
  }

  const handleFinalSubmit = async () => {
    if (!previewData) return

    if (!(session as ExtendedSession)?.discord) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Discord before submitting.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const discordId = (session as ExtendedSession).discord?.id

    if (!discordId) {
      toast({
        title: 'Authentication Error',
        description: 'Unable to retrieve Discord ID. Please try signing in again.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    // Check if user is banned
    const banned = await isUserBanned(discordId)
    if (banned) {
      toast({
        title: 'Access Denied',
        description: 'Your account has been banned from submitting applications.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      setShowPreview(false)
      return
    }

    // Check if user is blacklisted
    const blacklisted = await isUserBlacklisted(discordId)
    if (blacklisted) {
      toast({
        title: 'Access Denied',
        description: 'Your account has been blacklisted from submitting applications.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      setShowPreview(false)
      return
    }

    const applicationData = {
      ...previewData,
      applicationType: selectedType,
      discord: (session as ExtendedSession).discord,
      custom: customValues,
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      if (response.ok) {
        toast({
          title: applicationConfig.ui.successTitle,
          description: applicationConfig.ui.successDescription,
        })
        form.reset()
        setShowPreview(false)
      } else {
        throw new Error('Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: applicationConfig.ui.errorTitle,
        description: applicationConfig.ui.errorDescription,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const PreviewModal = () => {
    if (!showPreview || !previewData) return null

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          <div className="border-b border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Preview Your Application</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="h-8 w-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Review your information before final submission</p>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
            {applicationConfig.sections.map((section) => (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <div className="text-sm font-medium text-muted-foreground mb-1">{field.label}</div>
                      <div className={`bg-muted/30 rounded-md p-3 ${field.type === 'textarea' ? 'min-h-[100px] whitespace-pre-wrap' : ''}`}>
                        {previewData[field.name] || <span className="text-muted-foreground/50 italic">Not provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Fields Preview */}
            {(() => {
              const type = appTypes.find(t => t.id === selectedType)
              if (!type || !(type.fields || []).length) return null
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    </svg>
                    <h3 className="text-lg font-semibold">Additional Questions</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(type.fields || []).map((f) => (
                      <div key={f.id} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <div className="text-sm font-medium text-muted-foreground mb-1">{f.label}</div>
                        <div className={`bg-muted/30 rounded-md p-3 ${f.type === 'textarea' ? 'min-h-[100px] whitespace-pre-wrap' : ''}`}>
                          {(() => {
                            const val = customValues[f.id]
                            if (f.type === 'checkbox') return val ? 'Yes' : 'No'
                            return val || <span className="text-muted-foreground/50 italic">Not provided</span>
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="border-t border-border/50 bg-muted/20 px-6 py-4 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Edit
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <div className={`mb-8 ${session ? 'flex justify-end gap-4' : 'flex justify-center'}`}>
        <AuthButton />
      </div>
      {mounted && (
        <AnimatePresence>
          {(session as ExtendedSession)?.discord ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ProfileCard profile={(session as ExtendedSession).discord} />
              </div>
            </div>
            <div className="lg:col-span-2">
              {reapplyInfo && !reapplyInfo.canReapply && (
                (() => {
                  const msg = (reapplyInfo.message || '').toLowerCase()
                  const isApproved = msg.includes('approved')
                  const isPending = msg.includes('pending')
                  const color = isApproved
                    ? { border: 'border-green-500/50', bg: 'bg-green-500/10', icon: 'text-green-600', title: 'Already Approved' }
                    : isPending
                      ? { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', icon: 'text-yellow-600', title: 'Application Pending' }
                      : { border: 'border-red-500/50', bg: 'bg-red-500/10', icon: 'text-red-500', title: 'Re-application Cooldown Active' }

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <Card className={`${color.border} ${color.bg}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <svg className={`w-5 h-5 ${color.icon} mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${isApproved ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-red-500'}`}>{color.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {isApproved && 'You are already approved for this application type.'}
                                {isPending && 'You already have a pending application for this type.'}
                                {!isApproved && !isPending && `You must wait ${reapplyInfo.daysRemaining} more days before you can submit another application.`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })()
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Card className="border-border/50">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-3xl font-bold tracking-tight">{applicationConfig.ui.formTitle}</h2>
                          {lastSaved && (
                            <span className="text-xs text-muted-foreground">
                              Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{applicationConfig.ui.formDescription}</p>
                        {appTypes.length > 0 && (
                          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">Choose what to apply for</div>
                            <div className="flex gap-2 items-center">
                              <select
                                className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                              >
                                {appTypes.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {applicationConfig.sections.map((section, index) => (
                        <FormSection
                          key={section.id}
                          section={section}
                          form={form}
                          delay={0.1 + index * 0.1}
                        />
                      ))}

                      {/* Dynamic Custom Fields */}
                      {(() => {
                        const type = appTypes.find(t => t.id === selectedType)
                        if (!type || !(type.fields || []).length) return null
                        return (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                              </svg>
                              <h3 className="text-lg font-semibold">Additional Questions</h3>
                            </div>
                            <div className="space-y-6">
                              {(type.fields || []).map((f) => (
                                <div key={f.id}>
                                  <label className="text-sm font-medium mb-2 block">
                                    {f.label} {f.required && <span className="text-red-500">*</span>}
                                  </label>

                                  {f.type === 'textarea' && (
                                    <Textarea
                                      placeholder="Type your answer..."
                                      className="min-h-[120px] bg-background resize-none"
                                      value={customValues[f.id] ?? ''}
                                      onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                                    />
                                  )}

                                  {(f.type === 'text' || f.type === 'number') && (
                                    <Input
                                      type={f.type === 'number' ? 'number' : 'text'}
                                      placeholder="Type your answer..."
                                      className="bg-background"
                                      value={customValues[f.id] ?? ''}
                                      onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: f.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value }))}
                                    />
                                  )}

                                  {f.type === 'select' && (
                                    <select
                                      className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                                      value={customValues[f.id] ?? ''}
                                      onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                                    >
                                      <option value="" disabled>{f.required ? 'Select an option *' : 'Select an option'}</option>
                                      {(f.options || []).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  )}

                                  {f.type === 'checkbox' && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!customValues[f.id]}
                                        onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                      />
                                      <span className="text-sm text-muted-foreground">{f.label}</span>
                                    </div>
                                  )}

                                  {customErrors[f.id] && (
                                    <p className="text-xs text-red-500 mt-1">{customErrors[f.id]}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting || (!!reapplyInfo && !reapplyInfo.canReapply)}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Application
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <svg className="w-20 h-20 text-muted-foreground/30 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-2xl font-bold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Please sign in with Discord to access the whitelist application form and verify your identity.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      )}
      <PreviewModal />
    </motion.div>
  )
}

