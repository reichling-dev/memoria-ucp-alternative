'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Eye } from 'lucide-react'
import ProfileCard from './profile-card'
import type { DiscordUser } from '@/lib/types'

interface ApplicationPreviewProps {
  data: Record<string, any>
  discord: DiscordUser | undefined
  onClose: () => void
  onSubmit: () => void
}

export function ApplicationPreview({ data, discord, onClose, onSubmit }: ApplicationPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Application Preview</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {discord && (
              <Card>
                <CardHeader>
                  <CardTitle>Discord Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileCard profile={discord} />
                </CardContent>
              </Card>
            )}

            {data.characterName && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Character Name</p>
                    <p className="text-base">{data.characterName}</p>
                  </div>
                  {data.age && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Age</p>
                      <p className="text-base">{data.age} years old</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(data.steamId || data.cfxAccount) && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.steamId && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Steam ID</p>
                      <p className="text-base font-mono">{data.steamId}</p>
                    </div>
                  )}
                  {data.cfxAccount && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">CFX Account</p>
                      <a href={data.cfxAccount} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline break-all">
                        {data.cfxAccount}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {data.experience && (
              <Card>
                <CardHeader>
                  <CardTitle>Roleplay Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{data.experience}</p>
                    <p className="text-xs text-muted-foreground mt-2">{data.experience.length} characters</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.character && (
              <Card>
                <CardHeader>
                  <CardTitle>Character Backstory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{data.character}</p>
                    <p className="text-xs text-muted-foreground mt-2">{data.character.length} characters</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Go Back and Edit
              </Button>
              <Button onClick={onSubmit} className="flex-1">
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
