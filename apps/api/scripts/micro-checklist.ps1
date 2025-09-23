# 30-Second Micro-Checklist
# Usage: .\micro-checklist.ps1

param(
    [string]$Domain = "localhost:8000"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Functions
function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Micro-checklist execution
function Test-MicroChecklist {
    Log-Info "Running 30-second micro-checklist..."
    
    $allPassed = $true
    
    try {
        # Check production status
        $status = Invoke-RestMethod -Uri "https://$Domain/api/production/status"
        $emergency = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        
        Write-Host "`n" -NoNewline
        Write-Host "=" * 50 -ForegroundColor $Blue
        Write-Host "MICRO-CHECKLIST RESULTS" -ForegroundColor $Blue
        Write-Host "=" * 50 -ForegroundColor $Blue
        Write-Host "`n" -NoNewline
        
        # 1. BINANCE_TESTNET
        Write-Host "1. BINANCE_TESTNET: " -NoNewline
        if ($status.environment.isTestnet) {
            Write-Host "true (shadow mode)" -ForegroundColor $Yellow
        } else {
            Write-Host "false (live mode)" -ForegroundColor $Green
        }
        
        # 2. SAFETY_LOCK
        Write-Host "2. SAFETY_LOCK: " -NoNewline
        if ($emergency.controls.safetyLock) {
            Write-Host "true (shadow mode)" -ForegroundColor $Green
        } else {
            Write-Host "false (live mode)" -ForegroundColor $Red
            $allPassed = $false
        }
        
        # 3. Allowed symbols
        Write-Host "3. Symbol whitelist: " -NoNewline
        if ($emergency.controls.allowedSymbols -contains "BTCUSDT") {
            Write-Host "BTCUSDT included" -ForegroundColor $Green
        } else {
            Write-Host "BTCUSDT missing" -ForegroundColor $Red
            $allPassed = $false
        }
        
        # 4. Exchange status
        Write-Host "4. Exchange status: " -NoNewline
        if ($status.exchange.status -eq "connected") {
            Write-Host "connected" -ForegroundColor $Green
        } else {
            Write-Host "disconnected" -ForegroundColor $Red
            $allPassed = $false
        }
        
        # 5. Trading allowed
        Write-Host "5. Trading allowed: " -NoNewline
        if ($status.safety.tradingAllowed) {
            Write-Host "yes" -ForegroundColor $Green
        } else {
            Write-Host "no (expected in shadow)" -ForegroundColor $Yellow
        }
        
        # 6. Health check
        Write-Host "6. Health status: " -NoNewline
        try {
            $health = Invoke-RestMethod -Uri "https://$Domain/api/health"
            if ($health.status) {
                Write-Host "healthy" -ForegroundColor $Green
            } else {
                Write-Host "unhealthy" -ForegroundColor $Red
                $allPassed = $false
            }
        } catch {
            Write-Host "failed" -ForegroundColor $Red
            $allPassed = $false
        }
        
        Write-Host "`n" -NoNewline
        Write-Host "=" * 50 -ForegroundColor $Blue
        
        if ($allPassed) {
            Log-Success "Micro-checklist PASSED - Ready for shadow testing!"
            Write-Host "`nNext steps:" -ForegroundColor $Green
            Write-Host "1. Start shadow testing (5-10 minutes)"
            Write-Host "2. Monitor signal/alert/WS flow"
            Write-Host "3. Flip to live when ready"
            Write-Host "4. Test min notional orders"
        } else {
            Log-Error "Micro-checklist FAILED - Fix issues before proceeding!"
        }
        
        Write-Host "`n" -NoNewline
        Write-Host "=" * 50 -ForegroundColor $Blue
        
    } catch {
        Log-Error "Micro-checklist failed: $($_.Exception.Message)"
    }
}

# Execute micro-checklist
Test-MicroChecklist
