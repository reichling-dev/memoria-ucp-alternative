# FiveM Queue Integration - Quick Setup Checklist

## ✅ Configuration Checklist

### Website Configuration (Next.js)

- [ ] Add to `.env.local`:
  ```env
  FIVEM_SERVER_IP=your-ip:30120
  FIVEM_API_SECRET=your-strong-secret
  ```

### FiveM Server Configuration

- [ ] Edit `server.lua` lines 4-10:
  ```lua
  local DISCORD_BOT_TOKEN = "YOUR_BOT_TOKEN"
  local DISCORD_GUILD_ID = "YOUR_GUILD_ID"
  local DISCORD_WEBHOOK_URL = "YOUR_WEBHOOK"
  local WEBSITE_API_URL = "https://your-site.com/api/fivem/generate-token"
  local WEBSITE_API_SECRET = "same-as-env-FIVEM_API_SECRET"
  ```

- [ ] Edit `config.lua`:
  ```lua
  Config.EnableTokenAuth = true  -- Require website connections
  Config.MaxPlayers = 32  -- Your server max players
  ```

- [ ] Update Discord Role IDs in `config.lua`:
  ```lua
  Config.DiscordRoles = {
      ['owner'] = 'YOUR_OWNER_ROLE_ID',
      ['admin'] = 'YOUR_ADMIN_ROLE_ID',
      -- etc...
  }
  ```

- [ ] Add to `server.cfg`:
  ```cfg
  sv_endpointprivacy true
  ensure fivem-queue-web
  ```

## 🧪 Testing Steps

1. [ ] Start Next.js website: `npm run dev`
2. [ ] Start FiveM server
3. [ ] Open `http://localhost:3000/connect`
4. [ ] Login with Discord
5. [ ] Click "Connect to Server"
6. [ ] FiveM should launch
7. [ ] Check FiveM console for token validation logs

## 🔍 Verification

### Website Side:
```bash
# Check if API endpoints work
curl http://localhost:3000/api/fivem/queue-status
```

### FiveM Side:
- Check server console for: `[QUEUE] Advanced Queue System loaded`
- Type command: `queue` to see queue status
- Check for Discord API connection messages

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid token" | Check API_SECRET matches in both .env and server.lua |
| FiveM won't launch | Ensure FiveM is installed, try manual connect URL |
| Discord roles not working | Verify bot token and guild ID are correct |
| Token expired | Generate new token (5 min limit) |
| Server shows offline | Check server.cfg has `ensure fivem-queue-web` |

## 📱 Production Ready?

Before going live:

- [ ] Use HTTPS for website (required)
- [ ] Generate strong API secret (32+ characters)
- [ ] Test with multiple users
- [ ] Configure all Discord role IDs
- [ ] Set up Discord webhook for monitoring
- [ ] Test crash queue reconnection
- [ ] Test priority queue with different roles
- [ ] Monitor server logs for errors
- [ ] Add rate limiting to API endpoints
- [ ] Set up database for token persistence (optional)

## 🎉 You're Done!

Players can now connect ONLY through your website at `/connect` page!

### Features Available:
✅ Discord authentication required  
✅ Token-based secure connection  
✅ Priority queue by Discord roles  
✅ Admin bypass queue  
✅ Crash queue (exact position restore)  
✅ Unlimited queue size  
✅ Real-time server status  
✅ Beautiful UI  

---

**Next:** Customize the `/connect` page design to match your branding!
