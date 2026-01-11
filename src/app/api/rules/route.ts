import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'rules.json')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return new NextResponse(data, { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    // Fallback: return empty categories
    return NextResponse.json({ categories: [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}
