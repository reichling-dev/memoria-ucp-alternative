import { Button } from '@/components/ui/button'

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

type Application = {
  id: string
  timestamp: string
  username: string
  age: number
  steamId: string
  cfxAccount: string
  experience: string
  character: string
  discord: DiscordUser
  status?: 'pending' | 'approved' | 'denied'
}

interface AdminApplicationCardProps {
  app: Application
  onBlacklist?: (discordId: string) => void
  onBan?: (discordId: string) => void
}

export default function AdminApplicationCard({ app, onBlacklist, onBan }: AdminApplicationCardProps) {
  const handleBlacklist = () => {
    if (onBlacklist) {
      onBlacklist(app.discord.id)
    }
  }

  const handleBan = () => {
    if (onBan) {
      onBan(app.discord.id)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleBlacklist}>
        Blacklist
      </Button>
      <Button variant="destructive" onClick={handleBan}>
        Ban
      </Button>
    </div>
  )
}
