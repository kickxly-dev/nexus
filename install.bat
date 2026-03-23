@echo off
title Nexus Security Toolkit - Installer
color 0B

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     NEXUS SECURITY TOOLKIT v1.1.0         ║
echo  ║     Automated Setup Installer             ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo  OK: Node.js %%v

:: Check Python
echo [2/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Python not found. Install from https://python.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do echo  OK: %%v

:: Install Node dependencies
echo [3/5] Installing Node.js dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed
    pause & exit /b 1
)
echo  OK: Node.js dependencies installed

:: Install Python dependencies
echo [4/5] Installing Python dependencies...
python -m pip install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  WARNING: Some Python packages may have failed. Check backend\requirements.txt
) else (
    echo  OK: Python dependencies installed
)

:: Create data directories
echo [5/5] Setting up data directories...
if not exist "backend\data\wordlists" mkdir "backend\data\wordlists"
if not exist "backend\data\payloads"  mkdir "backend\data\payloads"
echo  OK: Data directories ready

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     INSTALLATION COMPLETE                 ║
echo  ║                                           ║
echo  ║   Run:  npm run dev     (development)     ║
echo  ║   Run:  npm run build   (production)      ║
echo  ║   Run:  start.bat       (quick launch)    ║
echo  ╚═══════════════════════════════════════════╝
echo.
pause
