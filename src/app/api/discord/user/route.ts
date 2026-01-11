import { NextResponse } from 'next/server'

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  banner: string | null
  accent_color: number | null
  verified: boolean
  email?: string
  createdAt: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json({ error: 'Discord bot token not configured' }, { status: 500 })
  }

  try {
    // Fetch user data from Discord API
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw new Error(`Discord API error: ${response.status}`)
    }

    const userData = await response.json()

    // Transform the data to match our DiscordUser interface
    const discordUser: DiscordUser = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      banner: userData.banner,
      accent_color: userData.accent_color,
      verified: userData.verified || false,
      email: userData.email,
      createdAt: new Date(Number(BigInt(userData.id) >> BigInt(22)) + 1420070400000).toISOString(),
    }

    return NextResponse.json(discordUser)
  } catch (error) {
    console.error('Error fetching Discord user:', error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}