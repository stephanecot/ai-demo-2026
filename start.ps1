#!/usr/bin/env pwsh
# Start the app: Spring Boot backend + Angular frontend.
# Each service runs in its own window so logs stay readable and both start cleanly.
$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

# Use a globally installed mvn if available, otherwise fall back to the wrapper
$mvn = if (Get-Command mvn -ErrorAction SilentlyContinue) { 'mvn' } else { 'mvnw.cmd' }

# Backend (http://localhost:8080)
# fork=false: run the app in the child process so it stops cleanly
$backend = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', "title backend && $mvn spring-boot:run -Dspring-boot.run.fork=false" `
    -WorkingDirectory (Join-Path $PSScriptRoot 'backend') -PassThru

# Frontend (http://localhost:4200)
$frontend = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', 'title frontend && npm start' `
    -WorkingDirectory (Join-Path $PSScriptRoot 'frontend') -PassThru

Write-Host ''
Write-Host 'Backend  -> http://localhost:8080  (PID ' $backend.Id ')'
Write-Host 'Frontend -> http://localhost:4200  (PID ' $frontend.Id ')'
Write-Host 'Press Ctrl+C here to stop both.'

# Stop both (and their child java/node processes) on Ctrl+C / exit
try {
    Wait-Process -Id $backend.Id, $frontend.Id
}
finally {
    foreach ($p in @($backend, $frontend)) {
        if ($p -and -not $p.HasExited) {
            taskkill /PID $p.Id /T /F 2>$null | Out-Null
        }
    }
}
