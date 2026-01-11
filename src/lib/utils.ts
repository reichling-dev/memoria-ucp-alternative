import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface BanEntry {
  discordId: string
  reason: string
  admin: string
  expires: string | null
}

export interface BlacklistEntry {
  discordId: string
  reason: string
  admin: string
  date: string
}

export async function isUserBanned(discordId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/users')
    if (!response.ok) return false

    const data = await response.json()
    const bans: BanEntry[] = data.bans || []

    return bans.some(ban => ban.discordId === discordId)
  } catch (error) {
    console.error('Error checking ban status:', error)
    return false
  }
}

export async function isUserBlacklisted(discordId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/users')
    if (!response.ok) return false

    const data = await response.json()
    const blacklist: BlacklistEntry[] = data.blacklist || []

    return blacklist.some(entry => entry.discordId === discordId)
  } catch (error) {
    console.error('Error checking blacklist status:', error)
    return false
  }
}
