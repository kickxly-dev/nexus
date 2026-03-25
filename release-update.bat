@echo off
title Nexus - Release Update
color 0A
echo.
echo  ================================================================
echo   NEXUS - Release New Version
echo  ================================================================
echo.

set /p GH_TOKEN="  Enter your GitHub token: "
if "%GH_TOKEN%"=="" ( echo [ERROR] No token. & pause & exit /b 1 )

set /p NEW_VERSION="  Enter new version (e.g. 1.3.0): "
if "%NEW_VERSION%"=="" ( echo [ERROR] No version. & pause & exit /b 1 )

:: Close the app if its running
echo  [*] Closing Nexus if open...
taskkill /f /im "Nexus.exe" >nul 2>&1

:: Bump version
echo  [*] Setting version to %NEW_VERSION%...
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='%NEW_VERSION%';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n','utf8');"

echo  [*] Building and publishing...
echo.
set GH_TOKEN=%GH_TOKEN%
call build.bat
