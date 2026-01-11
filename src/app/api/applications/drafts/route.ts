import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const draftsFilePath = path.join(process.cwd(), 'data', 'application_drafts.json')

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let drafts: any[] = []
    try {
      const data = await fs.readFile(draftsFilePath, 'utf8')
      drafts = JSON.parse(data)
    } catch {
      return NextResponse.json([])
    }

    // Return only drafts for the current user
    const userDrafts = drafts.filter(draft => draft.discord?.id === session.discord?.id)
    return NextResponse.json(userDrafts)
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const draft = await req.json()

    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    let drafts: any[] = []
    try {
      const data = await fs.readFile(draftsFilePath, 'utf8')
      drafts = JSON.parse(data)
    } catch {}

    const draftId = draft.id || Date.now().toString()
    const existingIndex = drafts.findIndex(d => d.id === draftId && d.discord?.id === session.discord?.id)

    const draftData = {
      ...draft,
      id: draftId,
      discord: session.discord,
      lastSaved: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      drafts[existingIndex] = draftData
    } else {
      drafts.push(draftData)
    }

    await fs.writeFile(draftsFilePath, JSON.stringify(drafts, null, 2))
    return NextResponse.json({ success: true, id: draftId })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 })
    }

    let drafts: any[] = []
    try {
      const data = await fs.readFile(draftsFilePath, 'utf8')
      drafts = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: 'No drafts found' }, { status: 404 })
    }

    drafts = drafts.filter(d => !(d.id === id && d.discord?.id === session.discord?.id))
    await fs.writeFile(draftsFilePath, JSON.stringify(drafts, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
