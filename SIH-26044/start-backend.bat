@echo off
title AICP - Backend Server Launcher
echo ==================================================
echo   Starting AICP Express Backend Server...
echo ==================================================

echo [1/3] Checking MongoDB (Port 27017)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue)) { Start-Process 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' -ArgumentList '--dbpath \"c:\SIH_Project\data\db\" --bind_ip 127.0.0.1 --port 27017' -WindowStyle Hidden; Write-Host 'MongoDB started on port 27017.' } else { Write-Host 'MongoDB is active.' }"

echo [2/3] Starting Express Backend (Port 5000)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/k title AICP-Backend && cd server && npm run dev'; Write-Host 'Backend server process launched.' } else { Write-Host 'Backend is already running on port 5000.' }"

timeout /t 2 >nul

echo [3/3] Opening Backend Gateway in browser...
echo.
echo ==================================================
echo   Backend is accessible at:
echo   Gateway & UI:  http://localhost:5000
echo   Health Check:  http://localhost:5000/health
echo   API Root:      http://localhost:5000/api
echo ==================================================
start http://localhost:5000

