@echo off
set PATH=%USERPROFILE%\nodejs-portable\node-v24.19.0-win-x64;%PATH%
cd /d "%~dp0"
npm run dev -- --hostname 0.0.0.0 --port 3000
