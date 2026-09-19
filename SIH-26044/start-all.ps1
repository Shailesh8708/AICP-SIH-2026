Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Starting AICP Full Stack Application...        " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. MongoDB
if (!(Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue)) {
    Write-Host "[1/4] Starting MongoDB on port 27017..." -ForegroundColor Yellow
    Start-Process 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' -ArgumentList '--dbpath "c:\SIH_Project\data\db" --bind_ip 127.0.0.1 --port 27017' -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/4] MongoDB is already running on port 27017." -ForegroundColor Green
}

# 2. Python AI Service
if (!(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue)) {
    Write-Host "[2/4] Starting Python AI Microservice on port 8000..." -ForegroundColor Yellow
    Start-Process wt.exe -ArgumentList "-w 0 nt -d `"c:\SIH_Project\SIH-26044\ai-service`" --title `"AICP AI Service`" py app.py" -ErrorAction SilentlyContinue
    if (!$?) {
        Start-Process cmd.exe -ArgumentList "/k title AICP AI Service && cd /d c:\SIH_Project\SIH-26044\ai-service && py app.py"
    }
} else {
    Write-Host "[2/4] AI Microservice is already running on port 8000." -ForegroundColor Green
}

# 3. Express Backend
if (!(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) {
    Write-Host "[3/4] Starting Node.js Express Backend on port 5000..." -ForegroundColor Yellow
    Start-Process wt.exe -ArgumentList "-w 0 nt -d `"c:\SIH_Project\SIH-26044\server`" --title `"AICP Backend`" node src/server.js" -ErrorAction SilentlyContinue
    if (!$?) {
        Start-Process cmd.exe -ArgumentList "/k title AICP Backend && cd /d c:\SIH_Project\SIH-26044\server && node src/server.js"
    }
} else {
    Write-Host "[3/4] Express Backend is already running on port 5000." -ForegroundColor Green
}

# 4. React Frontend
if (!(Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)) {
    Write-Host "[4/4] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
    Start-Process wt.exe -ArgumentList "-w 0 nt -d `"c:\SIH_Project\SIH-26044\client`" --title `"AICP Frontend`" npm run dev" -ErrorAction SilentlyContinue
    if (!$?) {
        Start-Process cmd.exe -ArgumentList "/k title AICP Frontend && cd /d c:\SIH_Project\SIH-26044\client && npm run dev"
    }
} else {
    Write-Host "[4/4] Vite Frontend is already running on port 5173." -ForegroundColor Green
}

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "   All AICP services are online!                  " -ForegroundColor Green
Write-Host "   Frontend:  http://localhost:5173               " -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:5000               " -ForegroundColor Cyan
Write-Host "   AI Micro:  http://localhost:8000               " -ForegroundColor Cyan
Write-Host "   Database:  127.0.0.1:27017                     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
Start-Process "http://localhost:5173"
