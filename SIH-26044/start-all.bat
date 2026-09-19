@echo off
title AICP - Academia-Industry Collaboration Portal
echo ==================================================
echo   Starting AICP Full Stack Application...
echo ==================================================

echo [1/4] Checking MongoDB (Port 27017)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue)) { Start-Process 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' -ArgumentList '--dbpath \"c:\SIH_Project\data\db\" --bind_ip 127.0.0.1 --port 27017' -WindowStyle Hidden; Write-Host 'MongoDB started.' } else { Write-Host 'MongoDB is already running.' }"

echo [2/4] Starting AI Microservice (Port 8000)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/k title AICP-AI && cd ai-service && py app.py'; Write-Host 'AI Service started.' } else { Write-Host 'AI Service is already running.' }"

echo [3/4] Starting Express Backend (Port 5000)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/k title AICP-Backend && cd server && npm start'; Write-Host 'Backend started.' } else { Write-Host 'Backend is already running.' }"

echo [4/4] Starting React Frontend (Port 5173)...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/k title AICP-Frontend && cd client && npm run dev'; Write-Host 'Frontend started.' } else { Write-Host 'Frontend is already running.' }"

timeout /t 3 >nul
echo.
echo ==================================================
echo   All AICP services are online!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   AI Micro:  http://localhost:8000
echo   Database:  127.0.0.1:27017
echo ==================================================
echo Opening web portal in your browser...
start http://localhost:5173
