import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, hasAnyStaffAccess } from '@/lib/auth'
import type { Application } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')
const scoresFilePath = path.join(process.cwd(), 'data', 'application_scores.json')

interface ApplicationScore {
  applicationId: string
  overallScore: number
  criteria: {
    experienceQuality: number
    characterDepth: number
    completeness: number
    length: number
  }
  reviewedBy: string
  reviewedAt: string
  notes?: string
}

function calculateScore(application: Application): ApplicationScore['criteria'] {
  const experienceLength = application.experience?.length || 0
  const characterLength = application.character?.length || 0

  // Experience quality score (0-25 points)
  const experienceQuality = Math.min(25, Math.floor(experienceLength / 2))

  // Character depth score (0-25 points)
  const characterDepth = Math.min(25, Math.floor(characterLength / 4))

  // Completeness score (0-25 points) - check if all required fields are filled
  let completeness = 25
  if (!application.age) completeness -= 5
  if (!application.steamId) completeness -= 5
  if (!application.cfxAccount) completeness -= 5
  if (!application.experience) completeness -= 5
  if (!application.character) completeness -= 5

  // Length score (0-25 points)
  const totalLength = experienceLength + characterLength
  const length = Math.min(25, Math.floor(totalLength / 10))

  return {
    experienceQuality,
    characterDepth,
    completeness,
    length,
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get('id')

    let scores: ApplicationScore[] = []
    try {
      const data = await fs.readFile(scoresFilePath, 'utf8')
      scores = JSON.parse(data)
    } catch {}

    if (applicationId) {
      const score = scores.find(s => s.applicationId === applicationId)
      return NextResponse.json(score || null)
    }

    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasAnyStaffAccess(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { applicationId, criteria, notes } = await req.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    // Verify application exists
    let applications: Application[] = []
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {}

    const application = applications.find(app => app.id === applicationId)
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Calculate scores if not provided
    const calculatedCriteria = criteria || calculateScore(application)
    const overallScore = Object.values(calculatedCriteria).reduce((sum, val) => sum + val, 0)

    const score: ApplicationScore = {
      applicationId,
      overallScore,
      criteria: calculatedCriteria,
      reviewedBy: session.discord.id,
      reviewedAt: new Date().toISOString(),
      notes,
    }

    let scores: ApplicationScore[] = []
    try {
      const data = await fs.readFile(scoresFilePath, 'utf8')
      scores = JSON.parse(data)
    } catch {}

    const existingIndex = scores.findIndex(s => s.applicationId === applicationId)
    if (existingIndex >= 0) {
      scores[existingIndex] = score
    } else {
      scores.push(score)
    }

    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    await fs.writeFile(scoresFilePath, JSON.stringify(scores, null, 2))

    return NextResponse.json(score)
  } catch (error) {
    console.error('Error saving score:', error)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}
