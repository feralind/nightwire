@echo off
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install it from https://nodejs.org then re-run this.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting Nightwire at http://localhost:3000
echo Close this window or press Ctrl+C to stop.
call npm run dev
pause
