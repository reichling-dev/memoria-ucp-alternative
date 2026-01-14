import { NextRequest, NextResponse } from 'next/server';
import { serverStatusConfig, applicationConfig } from '@/lib/config';

// FiveM server endpoint
const FIVEM_SERVER_IP = process.env.FIVEM_SERVER_IP || 'localhost:30120';

function coerceNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// Strip FiveM color codes from server names (e.g., ^1, ^2, etc.)
function stripFiveMColors(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(/\^[0-9]/g, '').trim();
}

function parseStatusPayload(payload: Record<string, unknown>) {
  const onlinePlayers = coerceNumber(
    (payload?.onlinePlayers ?? payload?.players ?? payload?.clients_online ?? payload?.clients ?? (Array.isArray(payload?.players) ? payload.players.length : undefined)) as unknown,
    0
  );

  const maxPlayers = coerceNumber(
    payload?.maxPlayers ?? 
    payload?.max_players ?? 
    payload?.sv_maxclients ?? 
    payload?.svMaxClients ?? 
    payload?.max_clients ?? 
    payload?.maxClients ?? 
    (payload?.vars as Record<string, unknown>)?.sv_maxclients ?? 
    (payload?.vars as Record<string, unknown>)?.svMaxClients ?? 
    (payload?.Data as Record<string, unknown>)?.sv_maxclients,
    serverStatusConfig.maxPlayersFallback
  );

  const queueLength = coerceNumber(
    (payload?.queueLength ?? payload?.queue ?? payload?.in_queue ?? ((payload?.resources as Record<string, unknown>)?.queue as unknown[] | undefined)?.length) as unknown,
    0
  );

  // Extract server name from various possible locations
  const serverName = (
    (payload?.vars as Record<string, unknown>)?.sv_projectName ??
    (payload?.vars as Record<string, unknown>)?.sv_hostname ??
    payload?.hostname ?? 
    payload?.sv_hostname ?? 
    payload?.server ?? 
    (payload?.Data as Record<string, unknown>)?.hostname
  ) as string | undefined;

  return { onlinePlayers, maxPlayers, queueLength, serverName: stripFiveMColors(serverName) };
}

async function fetchTxAdminStatus(playersUrl: string, infoUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds
  try {
    const [playersRes, infoRes] = await Promise.all([
      fetch(playersUrl, { 
        signal: controller.signal,
        cache: 'no-store'
      }).catch(err => {
        console.error('[FIVEM] Players fetch error:', err.message);
        throw err;
      }),
      fetch(infoUrl, { 
        signal: controller.signal,
        cache: 'no-store'
      }).catch(err => {
        console.error('[FIVEM] Info fetch error:', err.message);
        throw err;
      }),
    ]);
    clearTimeout(timeout);
    if (!playersRes.ok || !infoRes.ok) {
      throw new Error(`TXAdmin endpoints responded with ${playersRes.status}/${infoRes.status}`);
    }
    const players = await playersRes.json();
    const info = await infoRes.json();
    const onlinePlayers = Array.isArray(players) ? players.length : coerceNumber(players?.length, 0);
    const maxPlayers = coerceNumber(
      info?.vars?.sv_maxclients ?? 
      info?.vars?.svMaxClients ?? 
      info?.sv_maxclients ?? 
      info?.svMaxClients ?? 
      info?.max_clients ?? 
      info?.maxClients,
      serverStatusConfig.maxPlayersFallback
    );
    const serverName = stripFiveMColors((info?.vars?.sv_projectName ?? info?.vars?.sv_hostname ?? info?.sv_hostname ?? info?.hostname) as string | undefined);
    return { onlinePlayers, maxPlayers, queueLength: 0, serverName };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[FIVEM] TxAdmin request timeout after 8 seconds');
    }
    throw error;
  }
}

/**
 * Get queue status from FiveM server
 * GET /api/fivem/queue-status
 */
export async function GET(request: NextRequest) {
  const endpoint = process.env.FIVEM_STATUS_ENDPOINT || serverStatusConfig.statusEndpoint;
  const playersUrl = process.env.FIVEM_PLAYERS_JSON;
  const infoUrl = process.env.FIVEM_INFO_JSON;

  if (!endpoint && !(playersUrl && infoUrl)) {
    return NextResponse.json({
      success: true,
      data: {
        queueLength: 0,
        playerCount: 0,
        maxPlayers: serverStatusConfig.maxPlayersFallback,
        availableSlots: serverStatusConfig.maxPlayersFallback,
        serverOnline: false,
        serverName: applicationConfig.website.serverName
      }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds

  try {
    let onlinePlayers = 0;
    let maxPlayers = serverStatusConfig.maxPlayersFallback;
    let queueLength = 0;
    let serverName: string | undefined;

    if (endpoint) {
      const res = await fetch(endpoint, { 
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        console.error(`[FIVEM] Status endpoint responded with ${res.status}`);
        throw new Error(`Status endpoint responded with ${res.status}`);
      }
      
      const payload = await res.json();
      const parsed = parseStatusPayload(payload);
      onlinePlayers = parsed.onlinePlayers;
      maxPlayers = parsed.maxPlayers;
      queueLength = parsed.queueLength;
      serverName = parsed.serverName;
    } else if (playersUrl && infoUrl) {
      const tx = await fetchTxAdminStatus(playersUrl, infoUrl);
      clearTimeout(timeout);
      onlinePlayers = tx.onlinePlayers;
      maxPlayers = tx.maxPlayers;
      queueLength = tx.queueLength;
      serverName = tx.serverName;
    }

    const availableSlots = Math.max(0, maxPlayers - onlinePlayers);

    return NextResponse.json({
      success: true,
      data: {
        queueLength,
        playerCount: onlinePlayers,
        maxPlayers,
        availableSlots,
        serverOnline: true,
        serverName: serverName || applicationConfig.website.serverName // Fallback to config
      }
    }, {
      headers: {
        'Cache-Control': `s-maxage=${serverStatusConfig.cacheSeconds}, stale-while-revalidate=30`,
      },
    });

  } catch (error) {
    clearTimeout(timeout);
    
    // Log the specific error for debugging
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[FIVEM] Request timeout - server not responding');
      } else {
        console.error('[FIVEM] Queue status error:', error.message);
      }
    }
    
    // Return offline status instead of error
    return NextResponse.json({
      success: true, // Changed to true to prevent frontend errors
      data: {
        queueLength: 0,
        playerCount: 0,
        maxPlayers: serverStatusConfig.maxPlayersFallback,
        availableSlots: 0,
        serverOnline: false,
        serverName: applicationConfig.website.serverName // Use config when server offline
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}
