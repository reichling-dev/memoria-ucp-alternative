import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Store active tokens (in production, use Redis or database)
const activeTokens = new Map<string, {
  identifier: string;
  createdAt: number;
  userId: string;
  username: string;
  discordId: string;
}>();

// Clean up expired tokens every minute
setInterval(() => {
  const now = Date.now();
  const expireTime = 5 * 60 * 1000; // 5 minutes
  
  for (const [token, data] of activeTokens.entries()) {
    if (now - data.createdAt > expireTime) {
      activeTokens.delete(token);
    }
  }
}, 60000);

/**
 * Generate FiveM connection token
 * POST /api/fivem/generate-token
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.discord?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login with Discord.' },
        { status: 401 }
      );
    }

    const discordId = session.discord.id;
    const username = session.user?.name || 'Unknown';
    const userId = discordId; // Use Discord ID as user ID

    // Generate identifier for FiveM
    const identifier = `discord:${discordId}`;
    
    // Generate unique token
    const token = `${identifier}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Store token
    activeTokens.set(token, {
      identifier,
      createdAt: Date.now(),
      userId,
      username,
      discordId
    });

    // Get FiveM server IP from environment
    const fivemServerIp = process.env.FIVEM_SERVER_IP || 'localhost:30120';
    const connectUrl = `fivem://connect/${fivemServerIp}?token=${token}`;

    console.log(`[FIVEM QUEUE] Generated token for ${username} (${discordId})`);

    return NextResponse.json({
      success: true,
      token,
      connectUrl,
      expiresIn: 300, // 5 minutes in seconds
      serverIp: fivemServerIp
    });

  } catch (error) {
    console.error('[FIVEM QUEUE] Token generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate connection token' },
      { status: 500 }
    );
  }
}

/**
 * Validate token from FiveM server
 * Used by FiveM server to validate connection tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const apiKey = request.headers.get('x-api-key');

    // Verify API key (for FiveM server authentication)
    if (apiKey !== process.env.FIVEM_API_SECRET) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 400 }
      );
    }

    // Check if token exists
    const tokenData = activeTokens.get(token);

    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Token not found or expired'
      });
    }

    // Check if token is expired (5 minutes)
    const now = Date.now();
    const expireTime = 5 * 60 * 1000; // 5 minutes
    
    if (now - tokenData.createdAt > expireTime) {
      activeTokens.delete(token);
      return NextResponse.json({
        valid: false,
        error: 'Token expired'
      });
    }

    // Mark token as used and delete
    activeTokens.delete(token);

    return NextResponse.json({
      valid: true,
      identifier: tokenData.identifier,
      username: tokenData.username,
      discordId: tokenData.discordId,
      userId: tokenData.userId
    });

  } catch (error) {
    console.error('[FIVEM QUEUE] Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
