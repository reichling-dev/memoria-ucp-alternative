import { NextResponse } from 'next/server'
import { getBotStatus, forceProcessQueue } from '@/lib/discord-bot'

export async function GET() {
  try {
    const status = getBotStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking bot status:', error)
    return NextResponse.json({ error: 'Failed to check bot status' }, { status: 500 })
  }
}

export async function POST() {
  try {
    forceProcessQueue()
    return NextResponse.json({ message: 'Queue processing triggered' })
  } catch (error) {
    console.error('Error triggering queue processing:', error)
    return NextResponse.json({ error: 'Failed to trigger queue processing' }, { status: 500 })
  }
}