import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import type { Application, ApplicationFilters } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const filters: ApplicationFilters = await req.json()

    let applications: Application[] = []
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {
      return NextResponse.json([])
    }

    // Apply filters
    let filtered = applications

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(app =>
        app.username.toLowerCase().includes(searchLower) ||
        app.discord.id.includes(searchLower) ||
        app.discord.username.toLowerCase().includes(searchLower) ||
        app.steamId.includes(searchLower) ||
        app.characterName?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(app => app.priority === filters.priority)
    }

    // Assigned to filter
    if (filters.assignedTo) {
      filtered = filtered.filter(app => app.assignedTo === filters.assignedTo)
    }

    // Date range filter
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom)
      filtered = filtered.filter(app => new Date(app.timestamp) >= dateFrom)
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      filtered = filtered.filter(app => new Date(app.timestamp) <= dateTo)
    }

    // Age filter
    if (filters.ageMin !== undefined) {
      filtered = filtered.filter(app => app.age >= filters.ageMin!)
    }

    if (filters.ageMax !== undefined) {
      filtered = filtered.filter(app => app.age <= filters.ageMax!)
    }

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error searching applications:', error)
    return NextResponse.json({ error: 'Failed to search applications' }, { status: 500 })
  }
}
