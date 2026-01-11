import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const TRANSACTIONS_FILE = join(process.cwd(), 'data', 'transactions.json')

interface Transaction {
  timestamp: string
  [key: string]: unknown
}

export async function GET() {
  try {
    if (!existsSync(TRANSACTIONS_FILE)) {
      return NextResponse.json([])
    }

    const data = readFileSync(TRANSACTIONS_FILE, 'utf-8')
    const transactions = JSON.parse(data) as Transaction[]

    // Sort by timestamp descending (newest first)
    transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error reading transactions:', error)
    return NextResponse.json([], { status: 500 })
  }
}
