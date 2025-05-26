# Debug log tailing script for crypto-tracker (PowerShell)
# Usage: .\scripts\tail-debug-logs.ps1 [log-type]
# Available log types: stream, master, all, live, browser

param(
    [string]$LogType = "stream"
)

$RootDir = Split-Path -Parent $PSScriptRoot
$DataDir = Join-Path $RootDir "static\data"

Write-Host "🔍 Crypto Tracker Debug Log Tailer" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Root directory: $RootDir" -ForegroundColor Gray
Write-Host "Data directory: $DataDir" -ForegroundColor Gray
Write-Host ""

switch ($LogType.ToLower()) {
    "stream" {
        Write-Host "📊 Tailing debug stream log..." -ForegroundColor Yellow
        $StreamLog = Join-Path $DataDir "debug-stream.log"
        Write-Host "File: $StreamLog" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        if (Test-Path $StreamLog) {
            Get-Content $StreamLog -Wait -Tail 10
        } else {
            Write-Host "⚠️ Debug stream log not found. Creating empty file..." -ForegroundColor Yellow
            New-Item -Path $StreamLog -ItemType File -Force | Out-Null
            Write-Host "✅ Created empty debug-stream.log. Waiting for new entries..." -ForegroundColor Green
            Get-Content $StreamLog -Wait
        }
    }
    "master" {
        Write-Host "📚 Tailing master debug log..." -ForegroundColor Yellow
        $MasterLog = Join-Path $DataDir "debug-master.json"
        Write-Host "File: $MasterLog" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        if (Test-Path $MasterLog) {
            Get-Content $MasterLog -Wait -Tail 5
        } else {
            Write-Host "⚠️ Master debug log not found. Creating empty file..." -ForegroundColor Yellow
            "[]" | Out-File -FilePath $MasterLog -Encoding UTF8
            Write-Host "✅ Created empty debug-master.json. Waiting for new entries..." -ForegroundColor Green
            Get-Content $MasterLog -Wait
        }
    }
    "all" {
        Write-Host "🔄 Monitoring all debug files..." -ForegroundColor Yellow
        Write-Host "Files: debug-*.log, debug-*.json" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        $DebugFiles = Get-ChildItem -Path $DataDir -Filter "debug-*" -File
        
        if ($DebugFiles.Count -eq 0) {
            Write-Host "⚠️ No debug files found. Creating debug-stream.log..." -ForegroundColor Yellow
            $StreamLog = Join-Path $DataDir "debug-stream.log"
            New-Item -Path $StreamLog -ItemType File -Force | Out-Null
            Get-Content $StreamLog -Wait
        } else {
            Write-Host "Found debug files:" -ForegroundColor Green
            $DebugFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
            Write-Host ""
            
            # Monitor the first found debug file (PowerShell limitation)
            $FirstFile = $DebugFiles[0].FullName
            Write-Host "Monitoring: $($DebugFiles[0].Name)" -ForegroundColor Cyan
            Get-Content $FirstFile -Wait -Tail 10
        }
    }
    "live" {
        Write-Host "⚡ Live debug monitoring with timestamps..." -ForegroundColor Yellow
        $StreamLog = Join-Path $DataDir "debug-stream.log"
        Write-Host "Monitoring: debug-stream.log" -ForegroundColor Gray
        Write-Host "Format: [timestamp] [type] message" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        if (Test-Path $StreamLog) {
            Get-Content $StreamLog -Wait -Tail 10 | ForEach-Object {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] $_" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️ Debug stream log not found. Creating and monitoring..." -ForegroundColor Yellow
            New-Item -Path $StreamLog -ItemType File -Force | Out-Null
            Get-Content $StreamLog -Wait | ForEach-Object {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] $_" -ForegroundColor White
            }
        }
    }
    "browser" {
        Write-Host "🌐 Monitoring browser-related debug logs..." -ForegroundColor Yellow
        Write-Host "This will show browser tools server logs and extension logs" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""          # Check if browser tools server is running
        try {
            Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null
            Write-Host "✅ Browser tools server detected on port 3001" -ForegroundColor Green
            Write-Host "Monitoring both file logs and potential server logs..." -ForegroundColor Gray
        } catch {
            Write-Host "⚠️ Browser tools server not detected. Monitoring file logs only..." -ForegroundColor Yellow
        }
        
        $StreamLog = Join-Path $DataDir "debug-stream.log"
        if (Test-Path $StreamLog) {
            Get-Content $StreamLog -Wait -Tail 10
        } else {
            Write-Host "Creating debug-stream.log for browser monitoring..." -ForegroundColor Yellow
            New-Item -Path $StreamLog -ItemType File -Force | Out-Null
            Get-Content $StreamLog -Wait
        }
    }
    default {
        Write-Host "❌ Unknown log type: $LogType" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available log types:" -ForegroundColor Yellow
        Write-Host "  stream  - Tail debug-stream.log (default)" -ForegroundColor Gray
        Write-Host "  master  - Tail debug-master.json" -ForegroundColor Gray
        Write-Host "  all     - Monitor all debug files" -ForegroundColor Gray
        Write-Host "  live    - Live monitoring with timestamps" -ForegroundColor Gray
        Write-Host "  browser - Monitor browser-related logs" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\scripts\tail-debug-logs.ps1 stream" -ForegroundColor Gray
        Write-Host "  .\scripts\tail-debug-logs.ps1 master" -ForegroundColor Gray
        Write-Host "  .\scripts\tail-debug-logs.ps1 all" -ForegroundColor Gray
        Write-Host "  .\scripts\tail-debug-logs.ps1 live" -ForegroundColor Gray
        Write-Host "  .\scripts\tail-debug-logs.ps1 browser" -ForegroundColor Gray
        exit 1
    }
}
