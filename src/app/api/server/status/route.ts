import { NextResponse } from 'next/server'
import { serverStatusConfig } from '@/lib/config'

function coerceNumber(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseStatusPayload(payload: Record<string, unknown>) {
  const onlinePlayers = coerceNumber(
    (payload?.onlinePlayers ?? payload?.players ?? payload?.clients_online ?? payload?.clients ?? (Array.isArray(payload?.players) ? payload.players.length : undefined)) as unknown,
    0
  )

  const maxPlayers = coerceNumber(
    payload?.maxPlayers ?? payload?.max_players ?? payload?.sv_maxclients ?? payload?.max_clients,
    serverStatusConfig.maxPlayersFallback
  )

  const queueLength = coerceNumber(
    (payload?.queueLength ?? payload?.queue ?? payload?.in_queue ?? ((payload?.resources as Record<string, unknown>)?.queue as unknown[] | undefined)?.length) as unknown,
    0
  )

  return { onlinePlayers, maxPlayers, queueLength }
}

async function fetchTxAdminStatus(playersUrl: string, infoUrl: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const [playersRes, infoRes] = await Promise.all([
      fetch(playersUrl, { signal: controller.signal }),
      fetch(infoUrl, { signal: controller.signal }),
    ])
    clearTimeout(timeout)
    if (!playersRes.ok || !infoRes.ok) {
      throw new Error(`TXAdmin endpoints responded with ${playersRes.status}/${infoRes.status}`)
    }
    const players = await playersRes.json()
    const info = await infoRes.json()
    const onlinePlayers = Array.isArray(players) ? players.length : coerceNumber(players?.length, 0)
    const maxPlayers = coerceNumber(
      info?.vars?.sv_maxclients ?? info?.sv_maxclients ?? info?.max_clients,
      serverStatusConfig.maxPlayersFallback
    )
    return { onlinePlayers, maxPlayers }
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

export async function GET() {
  const endpoint = process.env.FIVEM_STATUS_ENDPOINT || serverStatusConfig.statusEndpoint
  const connectAddress = serverStatusConfig.connectAddress
  const playersUrl = process.env.FIVEM_PLAYERS_JSON
  const infoUrl = process.env.FIVEM_INFO_JSON

  if (!endpoint && !(playersUrl && infoUrl)) {
    return NextResponse.json(
      {
        status: 'offline',
        onlinePlayers: 0,
        maxPlayers: serverStatusConfig.maxPlayersFallback,
        queueLength: 0,
        queueEnabled: serverStatusConfig.queueEnabled,
        connectAddress,
        reason: 'STATUS_ENDPOINT_NOT_CONFIGURED',
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `s-maxage=${serverStatusConfig.cacheSeconds}, stale-while-revalidate=30`,
        },
      }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    let onlinePlayers = 0
    let maxPlayers = serverStatusConfig.maxPlayersFallback
    let queueLength = 0

    if (endpoint) {
      const res = await fetch(endpoint, { signal: controller.signal })
      if (!res.ok) {
        throw new Error(`Status endpoint responded with ${res.status}`)
      }
      const payload = await res.json()
      const parsed = parseStatusPayload(payload)
      onlinePlayers = parsed.onlinePlayers
      maxPlayers = parsed.maxPlayers
      queueLength = parsed.queueLength
    } else if (playersUrl && infoUrl) {
      const tx = await fetchTxAdminStatus(playersUrl, infoUrl)
      onlinePlayers = tx.onlinePlayers
      maxPlayers = tx.maxPlayers
      queueLength = 0
    }

    return NextResponse.json(
      {
        status: 'online',
        onlinePlayers,
        maxPlayers,
        queueLength,
        queueEnabled: serverStatusConfig.queueEnabled,
        connectAddress,
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `s-maxage=${serverStatusConfig.cacheSeconds}, stale-while-revalidate=30`,
        },
      }
    )
  } catch (error) {
    clearTimeout(timeout)
    return NextResponse.json(
      {
        status: 'offline',
        onlinePlayers: 0,
        maxPlayers: serverStatusConfig.maxPlayersFallback,
        queueLength: 0,
        queueEnabled: serverStatusConfig.queueEnabled,
        connectAddress,
        reason: endpoint ? 'STATUS_ENDPOINT_UNREACHABLE' : (playersUrl && infoUrl ? 'TXADMIN_ENDPOINT_UNREACHABLE' : 'STATUS_ENDPOINT_NOT_CONFIGURED'),
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `s-maxage=${serverStatusConfig.cacheSeconds}, stale-while-revalidate=30`,
        },
      }
    )
  }
}
