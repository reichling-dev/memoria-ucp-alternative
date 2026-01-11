import { NextResponse } from 'next/server'
import { initializeDiscordBot } from '@/lib/discord-bot'
import { initializeDataFiles } from '@/lib/init-data'

// Ensure initialization only happens once
let isInitialized = false
let initPromise: Promise<void> | null = null

// Initialize data files and Discord bot once on server startup
export async function GET() {
  if (isInitialized) {
    return NextResponse.json({ status: 'already_initialized' })
  }

  if (initPromise) {
    await initPromise
    return NextResponse.json({ status: 'initializing' })
  }

  try {
    initPromise = Promise.resolve().then(() => {
      // Initialize data files first
      console.log('🔧 Initializing data files...')
      const dataResult = initializeDataFiles()
      
      // Then initialize Discord bot
      console.log('🤖 Initializing Discord bot...')
      initializeDiscordBot()
      
      isInitialized = true
      console.log('✅ Server initialization complete')
    })
    
    await initPromise
    
    return NextResponse.json({ 
      status: 'initialized',
      message: 'Data files and Discord bot initialized successfully'
    })
  } catch (err) {
    console.error('Init endpoint error:', err)
    initPromise = null
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 })
  }
}
