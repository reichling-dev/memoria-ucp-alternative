@echo off
echo ============================================
echo FiveM Queue + Website Integration Setup
echo ============================================
echo.

:: Check if in correct directory
if not exist "src\app\connect\page.tsx" (
    echo ERROR: Please run this script from the aura-applications-0.2.0 directory
    pause
    exit /b 1
)

echo Step 1: Checking environment file...
if exist ".env.local" (
    echo .env.local found!
    echo.
    echo Add these lines to your .env.local:
    echo FIVEM_SERVER_IP=your-server-ip:30120
    echo FIVEM_API_SECRET=your-secret-key
) else (
    echo Creating .env.local...
    echo # FiveM Configuration > .env.local
    echo FIVEM_SERVER_IP=localhost:30120 >> .env.local
    echo FIVEM_API_SECRET=change-this-secret-key >> .env.local
    echo Created .env.local - PLEASE EDIT IT!
)

echo.
echo ============================================
echo IMPORTANT: Configuration Required
echo ============================================
echo.
echo 1. Edit .env.local and set:
echo    - FIVEM_SERVER_IP (your FiveM server IP:PORT)
echo    - FIVEM_API_SECRET (strong secret key)
echo.
echo 2. Edit FiveM server.lua (lines 1-10) and set:
echo    - DISCORD_BOT_TOKEN
echo    - DISCORD_GUILD_ID
echo    - DISCORD_WEBHOOK_URL
echo    - WEBSITE_API_URL (your website URL)
echo    - WEBSITE_API_SECRET (same as FIVEM_API_SECRET)
echo.
echo 3. Start website:
echo    npm run dev
echo.
echo 4. Visit: http://localhost:3000/connect
echo.
echo ============================================
echo Read FIVEM_INTEGRATION.md for full setup guide
echo ============================================
echo.
pause
