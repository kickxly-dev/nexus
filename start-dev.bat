@echo off
echo Starting Nexus Security Toolkit...
echo Electron will automatically start the Python backend.
echo.
cd /d %~dp0
set NODE_ENV=development
npm run dev
