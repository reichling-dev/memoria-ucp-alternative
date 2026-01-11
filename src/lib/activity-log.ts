import fs from 'fs/promises'
import path from 'path'
import type { ActivityLog } from './types'

const activityLogPath = path.join(process.cwd(), 'data', 'activity_log.json')

export async function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    let logs: ActivityLog[] = []
    try {
      const data = await fs.readFile(activityLogPath, 'utf8')
      logs = JSON.parse(data)
    } catch {
      // File doesn't exist, start with empty array
    }

    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    }

    logs.push(newLog)
    
    // Keep only last 10,000 logs to prevent file from getting too large
    if (logs.length > 10000) {
      logs = logs.slice(-10000)
    }

    await fs.writeFile(activityLogPath, JSON.stringify(logs, null, 2))
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - activity logging shouldn't break the application
  }
}

export async function getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
  try {
    const data = await fs.readFile(activityLogPath, 'utf8')
    const logs: ActivityLog[] = JSON.parse(data)
    return logs.slice(-limit).reverse()
  } catch {
    return []
  }
}

export async function getActivityLogsByType(type: ActivityLog['type'], limit: number = 100): Promise<ActivityLog[]> {
  try {
    const data = await fs.readFile(activityLogPath, 'utf8')
    const logs: ActivityLog[] = JSON.parse(data)
    return logs.filter(log => log.type === type).slice(-limit).reverse()
  } catch {
    return []
  }
}

export async function getActivityLogsByTarget(targetId: string, limit: number = 100): Promise<ActivityLog[]> {
  try {
    const data = await fs.readFile(activityLogPath, 'utf8')
    const logs: ActivityLog[] = JSON.parse(data)
    return logs.filter(log => log.targetId === targetId).slice(-limit).reverse()
  } catch {
    return []
  }
}
