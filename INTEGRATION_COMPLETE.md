# 🎉 FiveM Queue System - Website Integration Complete!

## ✅ What Has Been Created

### FiveM Server Files (fivem queue with web/)
1. ✅ `fxmanifest.lua` - Resource manifest
2. ✅ `config.lua` - Queue configuration (Discord roles, priorities, settings)
3. ✅ `server.lua` - Main queue logic with website API integration
4. ✅ `client.lua` - Client-side UI
5. ✅ `README.md` - Complete documentation

### Website Integration Files (aura-applications-0.2.0/)
1. ✅ `src/app/api/fivem/generate-token/route.ts` - Token generation API
2. ✅ `src/app/api/fivem/queue-status/route.ts` - Queue status API
3. ✅ `src/app/connect/page.tsx` - Beautiful connect page
4. ✅ `src/components/connect-button.tsx` - Reusable button component
5. ✅ `FIVEM_INTEGRATION.md` - Full setup guide
6. ✅ `FIVEM_CHECKLIST.md` - Quick setup checklist
7. ✅ `.env.fivem.example` - Environment variables template
8. ✅ `setup-fivem.bat` - Quick setup script

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Configure Website
```bash
cd "c:\Users\Administrator\Desktop\aura-applications-0.2.0"
```

Add to `.env.local`:
```env
FIVEM_SERVER_IP=your-server-ip:30120
FIVEM_API_SECRET=your-strong-secret-key
```

### Step 2: Configure FiveM Server

Edit `fivem queue with web/server.lua` (lines 4-10):
```lua
local DISCORD_BOT_TOKEN = "your_bot_token"
local DISCORD_GUILD_ID = "your_guild_id"  
local DISCORD_WEBHOOK_URL = "your_webhook_url"
local WEBSITE_API_URL = "http://localhost:3000/api/fivem/generate-token"
local WEBSITE_API_SECRET = "same-as-FIVEM_API_SECRET"
```

Edit `fivem queue with web/config.lua`:
```lua
Config.EnableTokenAuth = true  -- Require website connections
```

### Step 3: Start Everything
```bash
# Terminal 1 - Website
cd "c:\Users\Administrator\Desktop\aura-applications-0.2.0"
npm run dev

# Terminal 2 - FiveM Server
# Start your FiveM server normally
```

### Step 4: Test
1. Open: `http://localhost:3000/connect`
2. Login with Discord
3. Click "Connect to Server"
4. FiveM should launch!

---

## 🎯 Key Features

### Security Features
- ✅ **Token Authentication** - Players MUST connect through website
- ✅ **Discord Required** - No anonymous connections
- ✅ **One-Time Tokens** - Tokens expire after 5 minutes
- ✅ **API Secret Validation** - Secure server-to-server communication
- ✅ **Server-Side Credentials** - Discord tokens hidden from config

### Queue Features
- ✅ **Unlimited Queue** - No queue size limit
- ✅ **Priority System** - 10 Discord role-based priority levels
- ✅ **Admin Bypass** - Admins skip queue entirely
- ✅ **Crash Queue** - Exact position restoration for 3 minutes
- ✅ **Reserved Slots** - Keep slots for priority players
- ✅ **Real-Time Updates** - Live queue position display

### User Experience
- ✅ **Beautiful UI** - Modern, responsive design
- ✅ **Server Status** - Real-time player count, queue length
- ✅ **Auto-Launch** - FiveM opens automatically with token
- ✅ **Status Messages** - Clear feedback during connection

---

## 📁 File Structure

```
aura-applications-0.2.0/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── fivem/
│   │   │       ├── generate-token/route.ts  ← Token API
│   │   │       └── queue-status/route.ts    ← Status API
│   │   └── connect/
│   │       └── page.tsx                     ← Connect Page
│   └── components/
│       └── connect-button.tsx               ← Reusable Button
├── .env.local                               ← Your Config
├── FIVEM_INTEGRATION.md                     ← Setup Guide
├── FIVEM_CHECKLIST.md                       ← Quick Checklist
└── setup-fivem.bat                          ← Setup Script

fivem queue with web/
├── fxmanifest.lua          ← Resource Manifest
├── config.lua              ← Queue Settings
├── server.lua              ← Main Logic (513 lines)
├── client.lua              ← Client UI
└── README.md               ← Documentation
```

---

## 🔧 Configuration Reference

### Environment Variables (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| `FIVEM_SERVER_IP` | Your FiveM server IP:PORT | `123.45.67.89:30120` |
| `FIVEM_API_SECRET` | Secret key for API auth | `my-strong-secret-123` |

### Server Variables (server.lua)
| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `DISCORD_GUILD_ID` | Your Discord server ID |
| `DISCORD_WEBHOOK_URL` | Discord webhook for logs |
| `WEBSITE_API_URL` | Your website token API URL |
| `WEBSITE_API_SECRET` | Must match FIVEM_API_SECRET |

---

## 🎨 Customization

### Add Connect Button to Home Page

Edit your homepage and add:
```tsx
import { ConnectButton } from '@/components/connect-button';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Our Server</h1>
      <ConnectButton size="lg" />
    </div>
  );
}
```

### Customize Connect Page Design

Edit: `src/app/connect/page.tsx`

### Change Priority Levels

Edit: `fivem queue with web/config.lua`
```lua
Config.Priorities = {
    ['owner'] = 1000,
    ['admin'] = 800,
    -- Add your custom roles
}
```

---

## 🔍 How Token Flow Works

```
1. Player visits website → /connect page
2. Clicks "Connect" → POST /api/fivem/generate-token
3. Website generates token → Stores in memory (5 min)
4. Returns: fivem://connect/IP:PORT?token=TOKEN
5. Browser launches FiveM with token
6. FiveM extracts token from connection
7. FiveM calls website → GET /api/fivem/generate-token?token=TOKEN
8. Website validates → Returns player Discord info
9. FiveM adds to queue with priority
10. Player connects when slot available
```

---

## 📊 Priority System

| Role | Priority | Access |
|------|----------|--------|
| Owner | 1000 | Bypass Queue |
| Management | 900 | Bypass Queue |
| Admin | 800 | Bypass Queue |
| Moderator | 700 | High Priority |
| VIP Platinum | 600 | High Priority |
| VIP Gold | 500 | Medium Priority |
| VIP Silver | 400 | Medium Priority |
| VIP Bronze | 300 | Low Priority |
| Member | 200 | Low Priority |
| Default | 100 | Standard |
| **Crash Queue** | **950** | **Higher than most VIPs** |

---

## 🧪 Testing Checklist

- [ ] Website starts: `npm run dev`
- [ ] FiveM server starts
- [ ] Can access `/connect` page
- [ ] Can login with Discord
- [ ] "Connect" button generates token
- [ ] FiveM launches with token
- [ ] Token validated in FiveM console
- [ ] Player added to queue (if full)
- [ ] Queue position updates
- [ ] Player connects when slot available
- [ ] Crash and reconnect works

---

## 🚨 Troubleshooting

### "Invalid Token" Error
**Solution:** Ensure `FIVEM_API_SECRET` in `.env.local` matches `WEBSITE_API_SECRET` in `server.lua`

### FiveM Doesn't Launch
**Solutions:**
1. Ensure FiveM is installed
2. Check browser allows `fivem://` protocol
3. Try manual copy/paste of connect URL

### Discord Roles Not Working
**Solutions:**
1. Verify bot token is correct
2. Enable "Server Members Intent" in Discord Developer Portal
3. Check bot is in your Discord server
4. Verify role IDs in config.lua

### Token Expired
**Solution:** Tokens expire after 5 minutes. Generate a new one by clicking "Connect" again.

---

## 📝 Commands

### FiveM Console Commands
```
queue          - View queue status
clearqueue     - Clear all players from queue (admin)
```

### Website URLs
```
/connect                      - Connect page
/api/fivem/generate-token    - Token generation API (POST)
/api/fivem/queue-status      - Queue status API (GET)
```

---

## 🎉 You're All Set!

Players can now **ONLY** connect through your website!

### Next Steps:
1. ✅ Configure Discord bot credentials
2. ✅ Set up role IDs for priority
3. ✅ Test the connection flow
4. ✅ Customize the UI to match your brand
5. ✅ Deploy to production

---

## 📚 Documentation Files

- **FIVEM_INTEGRATION.md** - Complete setup guide with details
- **FIVEM_CHECKLIST.md** - Quick setup checklist
- **README.md** - FiveM resource documentation
- **This file** - Summary and quick reference

---

## 💡 Pro Tips

1. **Use HTTPS in production** - Required for secure token transfer
2. **Strong API secrets** - Use 32+ character random strings
3. **Monitor logs** - Check both website and FiveM console
4. **Test crash queue** - Disconnect and reconnect within 3 minutes
5. **Configure all roles** - Set up proper Discord role IDs
6. **Add to navigation** - Put connect link in main menu

---

## 🤝 Support

Check console logs for errors:
- **Browser**: F12 → Console tab
- **FiveM**: F8 in-game
- **Next.js**: Terminal where `npm run dev` runs

All features are fully implemented and ready to use! 🚀
