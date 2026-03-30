param(
    [string]$BackendLocalUrl = "http://localhost:5000",
    [string]$FrontendLocalUrl = "http://localhost:5173",
    [string]$BackendCommand,
    [string]$FrontendCommand,
    [string]$BackendEnvPath = "backend\.env",
    [int]$StartupTimeoutSeconds = 45
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-WarnLine {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Test-HttpEndpoint {
    param([string]$Url)

    try {
        $null = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -UseBasicParsing
        return $true
    } catch {
        return $false
    }
}

function Set-OrAppendEnvValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )

    $fullPath = Join-Path $repoRoot $FilePath
    if (-not (Test-Path $fullPath)) {
        throw "Backend env file not found at $fullPath"
    }

    $content = Get-Content -Path $fullPath -Raw -ErrorAction Stop
    $pattern = "(?m)^$([regex]::Escape($Key))=.*$"
    $replacement = "${Key}=${Value}"

    if ($content -match $pattern) {
        $updatedContent = [regex]::Replace($content, $pattern, $replacement)
    } else {
        $trimmedContent = $content.TrimEnd("`r", "`n")
        if ($trimmedContent.Length -gt 0) {
            $updatedContent = $trimmedContent + "`r`n`r`n" + $replacement + "`r`n"
        } else {
            $updatedContent = $replacement + "`r`n"
        }
    }

    [System.IO.File]::WriteAllText($fullPath, $updatedContent, [System.Text.UTF8Encoding]::new($false))
}

function Ensure-LocalService {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Command,
        [int]$TimeoutSeconds
    )

    if (Test-HttpEndpoint -Url $Url) {
        Write-Host "$Name is already reachable at $Url" -ForegroundColor Green
        return
    }

    if ($Command) {
        Write-Host "Starting $Name with command: $Command" -ForegroundColor Green
        Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $Command | Out-Null
    } else {
        throw "$Name is not reachable at $Url. Start it manually or pass -${Name}Command."
    }

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        if (Test-HttpEndpoint -Url $Url) {
            Write-Host "$Name is now reachable at $Url" -ForegroundColor Green
            return
        }
    }

    throw "$Name did not become reachable at $Url within $TimeoutSeconds seconds."
}

function Start-QuickTunnel {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds
    )

    $safeName = $Name.ToLowerInvariant()
    $stdoutPath = Join-Path $env:TEMP ("cloudflared-{0}-{1}-out.log" -f $safeName, [guid]::NewGuid().ToString("N"))
    $stderrPath = Join-Path $env:TEMP ("cloudflared-{0}-{1}-err.log" -f $safeName, [guid]::NewGuid().ToString("N"))

    Write-Host "Starting Cloudflare Quick Tunnel for $Name -> $Url" -ForegroundColor Green
    $process = Start-Process -FilePath "cloudflared" `
        -ArgumentList @("tunnel", "--url", $Url, "--no-autoupdate") `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $regex = [regex]'https://[a-z0-9-]+\.trycloudflare\.com'

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500

        foreach ($logPath in @($stdoutPath, $stderrPath)) {
            if (-not (Test-Path $logPath)) {
                continue
            }

            $content = Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue
            if (-not $content) {
                continue
            }

            $match = $regex.Match($content)
            if ($match.Success) {
                return @{
                    Name = $Name
                    Url = $match.Value
                    ProcessId = $process.Id
                    StdoutLog = $stdoutPath
                    StderrLog = $stderrPath
                }
            }
        }

        if ($process.HasExited) {
            throw "Cloudflare tunnel for $Name exited early. Check $stdoutPath and $stderrPath."
        }
    }

    throw "Timed out waiting for the Cloudflare tunnel URL for $Name. Check $stdoutPath and $stderrPath."
}

Write-Step "Checking cloudflared installation"
$cloudflaredCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredCommand) {
    throw "cloudflared is not installed or not on PATH. Install Cloudflare Tunnel first."
}
Write-Host "Using cloudflared at $($cloudflaredCommand.Source)" -ForegroundColor Green

Write-Step "Ensuring backend and frontend are running locally"
Ensure-LocalService -Name "Backend" -Url $BackendLocalUrl -Command $BackendCommand -TimeoutSeconds $StartupTimeoutSeconds
Ensure-LocalService -Name "Frontend" -Url $FrontendLocalUrl -Command $FrontendCommand -TimeoutSeconds $StartupTimeoutSeconds

Write-Step "Starting Cloudflare Quick Tunnels"
$backendTunnel = Start-QuickTunnel -Name "Backend" -Url $BackendLocalUrl -TimeoutSeconds $StartupTimeoutSeconds
$frontendTunnel = Start-QuickTunnel -Name "Frontend" -Url $FrontendLocalUrl -TimeoutSeconds $StartupTimeoutSeconds

Write-Step "Tunnel URLs"
Write-Host ("BACKEND_URL = {0}" -f $backendTunnel.Url) -ForegroundColor Green
Write-Host ("FRONTEND_URL = {0}" -f $frontendTunnel.Url) -ForegroundColor Green

Write-Step "Updating backend env file"
Set-OrAppendEnvValue -FilePath $BackendEnvPath -Key "BACKEND_URL" -Value $backendTunnel.Url
Set-OrAppendEnvValue -FilePath $BackendEnvPath -Key "FRONTEND_URL" -Value $frontendTunnel.Url
Write-Host ("Updated {0}" -f (Join-Path $repoRoot $BackendEnvPath)) -ForegroundColor Green

Write-Step "Current runtime values"
Write-Host ('$env:BACKEND_URL="{0}"' -f $backendTunnel.Url)
Write-Host ('$env:FRONTEND_URL="{0}"' -f $frontendTunnel.Url)
Write-Host "backend/.env has been updated automatically." -ForegroundColor Green
Write-Host "Newly generated emails will use these tunnel URLs without restarting the backend." -ForegroundColor Green

Write-Step "Tunnel details"
Write-Host ("Backend tunnel PID: {0}" -f $backendTunnel.ProcessId)
Write-Host ("Backend tunnel logs: {0} | {1}" -f $backendTunnel.StdoutLog, $backendTunnel.StderrLog)
Write-Host ("Frontend tunnel PID: {0}" -f $frontendTunnel.ProcessId)
Write-Host ("Frontend tunnel logs: {0} | {1}" -f $frontendTunnel.StdoutLog, $frontendTunnel.StderrLog)

Write-Step "Important reminders"
Write-WarnLine "Old email links stop working after tunnel rotation. Generate a fresh MCQ email every time these tunnel URLs change."
Write-WarnLine "The script updated backend/.env automatically. Newly generated emails will now use the current tunnel URLs immediately."
Write-WarnLine "Keep this machine, the backend, the frontend, and both cloudflared processes running for the entire phone test session."
