# FiveM Queue Integration - Setup Guide

This guide explains how to integrate the FiveM queue system with your Next.js website.

## ✅ What's Been Integrated

1. **API Routes Created:**
   - `/api/fivem/generate-token` - Generates connection tokens for authenticated users
   - `/api/fivem/queue-status` - Returns server queue status

2. **Connect Page Created:**
   - `/connect` - Beautiful UI for players to connect to FiveM server

3. **Features:**
   - Discord authentication required
   - Secure token-based connection
   - Real-time server status display
   - Queue position tracking
   - Auto-launch FiveM with token

## 🚀 Setup Instructions

### 1. Configure Environment Variables

Add these to your `.env.local` file in the Next.js project root:

```env
# FiveM Server Configuration
FIVEM_SERVER_IP=your-server-ip:30120
FIVEM_API_SECRET=your-strong-secret-key-here
```

**Important:** The `FIVEM_API_SECRET` must match the `WEBSITE_API_SECRET` in your FiveM server.lua file.

### 2. Update FiveM Server Configuration

Edit `server.lua` in your FiveM resource (lines 1-10):

```lua
local DISCORD_BOT_TOKEN = "your_actual_bot_token"
local DISCORD_GUILD_ID = "your_actual_guild_id"
local DISCORD_WEBHOOK_URL = "your_webhook_url"

local WEBSITE_API_URL = "https://your-website.com/api/fivem/generate-token"
local WEBSITE_API_SECRET = "same-as-FIVEM_API_SECRET-in-env"
```

### 3. Configure FiveM Server

In your FiveM `server.cfg`, ensure you have:

```cfg
# Enable token passing
sv_endpointprivacy true

# Start the queue resource
ensure fivem-queue-web
```

### 4. Test the Integration

1. **Start your Next.js website:**
   ```bash
   cd "c:\Users\Administrator\Desktop\aura-applications-0.2.0"
   npm run dev
   ```

2. **Start your FiveM server**

3. **Test the connection:**
   - Go to `http://localhost:3000/connect`
   - Login with Discord
   - Click "Connect to Server"
   - FiveM should launch with the token

## 🔧 How It Works

### Connection Flow:

1. **Player visits `/connect` page**
   - Sees server status (players, queue, available slots)
   - Must be logged in with Discord

2. **Player clicks "Connect to Server"**
   - Website calls `/api/fivem/generate-token`
   - Token is generated and associated with player's Discord ID
   - Token expires after 5 minutes

3. **FiveM launches with token**
   - Browser redirects to `fivem://connect/SERVER_IP?token=TOKEN`
   - FiveM launches and connects to server with token

4. **FiveM validates token**
   - Server extracts token from connection
   - Calls website API to validate: `/api/fivem/generate-token?token=TOKEN`
   - Website confirms token is valid and returns player info

5. **Queue processing**
   - If server full, player added to queue
   - Priority based on Discord roles
   - Real-time position updates

6. **Player connects**
   - When slot available, player connects
   - Token is consumed (one-time use)

## 🎨 Customization

### Change Connect Page Design

Edit: `src/app/connect/page.tsx`

### Modify API Behavior

Edit: 
- `src/app/api/fivem/generate-token/route.ts`
- `src/app/api/fivem/queue-status/route.ts`

### Update Server Logic

Edit: `fivem queue with web/server.lua`

## 🔒 Security Features

✅ Token-based authentication (one-time use)  
✅ 5-minute token expiration  
✅ Discord authentication required  
✅ API secret key validation  
✅ Secure HTTPS communication (production)  
✅ No direct server connections allowed  

## 🧪 Testing Locally

### Without Token Auth (for testing):

In `config.lua`:
```lua
Config.EnableTokenAuth = false
```

This allows direct connections without website tokens (testing only).

### With Token Auth (production):

In `config.lua`:
```lua
Config.EnableTokenAuth = true
```

Players must connect through website.

## 📱 Adding Connect Button to Other Pages

You can add a connect button anywhere on your website:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

export function ConnectButton() {
  return (
    <Link href="/connect">
      <Button size="lg">
        <PlayCircle className="mr-2 h-5 w-5" />
        Connect to Server
      </Button>
    </Link>
  );
}
```

## 🚨 Troubleshooting

### Token validation fails:
1. Check `FIVEM_API_SECRET` matches in both `.env.local` and `server.lua`
2. Ensure website URL is correct in `server.lua`
3. Check FiveM console for error messages

### FiveM doesn't launch:
1. Ensure FiveM is installed
2. Check browser allows `fivem://` protocol
3. Try manually copying the connect URL

### "Invalid token" error:
1. Token may have expired (5 min limit)
2. Token may have already been used
3. Check server console logs

### Server shows offline:
1. Implement queue status endpoint in FiveM
2. Or update API to fetch from your server

## 📊 Production Deployment

### Website (Next.js):

1. **Deploy to Vercel/Netlify:**
   ```bash
   npm run build
   ```

2. **Set environment variables** in hosting dashboard:
   - `FIVEM_SERVER_IP`
   - `FIVEM_API_SECRET`

3. **Update FiveM server.lua** with production URL:
   ```lua
   local WEBSITE_API_URL = "https://yourdomain.com/api/fivem/generate-token"
   ```

### FiveM Server:

1. **Enable HTTPS** for your website (required)
2. **Use strong API secret**
3. **Configure firewall** to allow website API calls
4. **Monitor logs** for failed attempts

## 🎯 Next Steps

1. ✅ Configure Discord credentials in server.lua
2. ✅ Set environment variables in .env.local
3. ✅ Test connection flow locally
4. ✅ Customize connect page design
5. ✅ Deploy to production
6. ✅ Monitor and optimize

## 💡 Tips

- Use Redis for token storage in production (scale better)
- Implement rate limiting on token generation
- Add analytics to track connection attempts
- Consider adding queue position notifications
- Add webhook notifications for admin monitoring

## 📝 File Changes Made

### New Files Created:
- `src/app/api/fivem/generate-token/route.ts` - Token generation API
- `src/app/api/fivem/queue-status/route.ts` - Queue status API
- `src/app/connect/page.tsx` - Connect page UI
- `.env.fivem.example` - Environment variables template

### Modified Files:
- `fivem queue with web/server.lua` - Updated token validation
- `fivem queue with web/config.lua` - Removed sensitive data

---

**Need Help?** Check the console logs in:
- Browser DevTools (F12)
- Next.js terminal
- FiveM server console (F8)
