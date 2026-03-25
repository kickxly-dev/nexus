@echo off
setlocal enabledelayedexpansion
title Nexus - Production Build
color 0A
echo.
echo  ================================================================
echo   NEXUS SECURITY TOOLKIT - Production Build
echo  ================================================================
echo.

where python >nul 2>&1
if errorlevel 1 ( echo  [ERROR] Python not found. & pause & exit /b 1 )
where node >nul 2>&1
if errorlevel 1 ( echo  [ERROR] Node.js not found. & pause & exit /b 1 )

:: ── Python backend ──────────────────────────────────────────────────
if exist "backend\dist\nexus-backend.exe" (
    echo  [SKIP] Backend already built. Delete backend\dist\ to force rebuild.
) else (
    echo  [1/3] Building Python backend ^(one-time, takes 2-5 min^)...
    cd backend
    pip install -r requirements.txt --quiet
    pip install pyinstaller --quiet
    if exist build_pyinstaller rmdir /s /q build_pyinstaller
    pyinstaller nexus.spec --distpath dist --workpath build_pyinstaller --noconfirm
    if errorlevel 1 ( echo  [ERROR] PyInstaller failed. & cd .. & pause & exit /b 1 )
    if exist build_pyinstaller rmdir /s /q build_pyinstaller
    cd ..
    echo  [OK] Backend built.
)

:: ── Frontend ─────────────────────────────────────────────────────────
echo  [2/3] Building frontend...
cd renderer && call npm run build && cd ..
if errorlevel 1 ( echo  [ERROR] Frontend build failed. & pause & exit /b 1 )

:: ── Kill app + clean old release files ──────────────────────────────
taskkill /f /im "Nexus.exe" >nul 2>&1
taskkill /f /im "nexus-backend.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
if exist release\win-unpacked rmdir /s /q release\win-unpacked
del /q release\*.exe 2>nul
del /q release\*.blockmap 2>nul
del /q release\*.yaml 2>nul
del /q release\*.yml 2>nul

:: ── Package ──────────────────────────────────────────────────────────
echo  [3/3] Packaging...
if defined GH_TOKEN (
    call npx electron-builder --win --publish always
) else (
    call npx electron-builder --win --publish never
)
if errorlevel 1 ( echo  [ERROR] Packaging failed. & pause & exit /b 1 )

echo.
echo  ================================================================
echo   DONE — release\Nexus Setup %npm_package_version%.exe
echo  ================================================================
echo.
pause
