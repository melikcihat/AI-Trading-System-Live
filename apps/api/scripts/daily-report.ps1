# Daily Report Script
# Usage: .\daily-report.ps1

param(
    [string]$Domain = "localhost:8000",
    [string]$JwtToken = ""
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

# Get performance summary
function Get-PerformanceSummary {
    Log-Info "Fetching performance summary..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary"
        return $response
    } catch {
        Log-Error "Failed to fetch performance summary: $($_.Exception.Message)"
        return $null
    }
}

# Get production status
function Get-ProductionStatus {
    Log-Info "Fetching production status..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/production/status"
        return $response
    } catch {
        Log-Error "Failed to fetch production status: $($_.Exception.Message)"
        return $null
    }
}

# Get emergency status
function Get-EmergencyStatus {
    Log-Info "Fetching emergency status..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        return $response
    } catch {
        Log-Error "Failed to fetch emergency status: $($_.Exception.Message)"
        return $null
    }
}

# Generate daily report
function New-DailyReport {
    $date = Get-Date -Format "yyyy-MM-dd"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor $Blue
    Write-Host "DAILY REPORT - $date" -ForegroundColor $Blue
    Write-Host "Generated: $timestamp" -ForegroundColor $Blue
    Write-Host "=" * 60 -ForegroundColor $Blue
    Write-Host "`n" -NoNewline
    
    # Performance Metrics
    $performance = Get-PerformanceSummary
    if ($performance) {
        Write-Host "PERFORMANCE METRICS" -ForegroundColor $Green
        Write-Host "-" * 20 -ForegroundColor $Green
        
        $summary = $performance.summary
        Write-Host "Total PnL: " -NoNewline
        if ($summary.totalPnL -ge 0) {
            Write-Host "$$($summary.totalPnL.ToString('F2'))" -ForegroundColor $Green
        } else {
            Write-Host "$$($summary.totalPnL.ToString('F2'))" -ForegroundColor $Red
        }
        
        Write-Host "Win Rate: $($summary.winRate.ToString('P1'))"
        Write-Host "Max Drawdown: $($summary.maxDD.ToString('P1'))" -ForegroundColor $Red
        Write-Host "Profit Factor: $($summary.profitFactor.ToString('F2'))"
        Write-Host "Total Trades: $($summary.totalTrades)"
        Write-Host "Best Trade: $$($summary.bestTrade.ToString('F2'))" -ForegroundColor $Green
        Write-Host "Worst Trade: $$($summary.worstTrade.ToString('F2'))" -ForegroundColor $Red
        Write-Host "Avg Trade: $$($summary.avgTrade.ToString('F2'))"
        Write-Host "`n" -NoNewline
    }
    
    # System Health
    $production = Get-ProductionStatus
    if ($production) {
        Write-Host "SYSTEM HEALTH" -ForegroundColor $Blue
        Write-Host "-" * 15 -ForegroundColor $Blue
        
        Write-Host "Environment: " -NoNewline
        if ($production.environment.isProduction) {
            Write-Host "PRODUCTION" -ForegroundColor $Green
        } else {
            Write-Host "DEVELOPMENT" -ForegroundColor $Yellow
        }
        
        Write-Host "Exchange: " -NoNewline
        if ($production.exchange.status -eq "connected") {
            Write-Host "CONNECTED" -ForegroundColor $Green
        } else {
            Write-Host "DISCONNECTED" -ForegroundColor $Red
        }
        
        Write-Host "Testnet: " -NoNewline
        if ($production.environment.isTestnet) {
            Write-Host "YES" -ForegroundColor $Yellow
        } else {
            Write-Host "NO" -ForegroundColor $Green
        }
        
        Write-Host "`n" -NoNewline
    }
    
    # Safety Status
    $emergency = Get-EmergencyStatus
    if ($emergency) {
        Write-Host "SAFETY STATUS" -ForegroundColor $Yellow
        Write-Host "-" * 15 -ForegroundColor $Yellow
        
        Write-Host "Trading Allowed: " -NoNewline
        if ($emergency.isTradingAllowed) {
            Write-Host "YES" -ForegroundColor $Green
        } else {
            Write-Host "NO" -ForegroundColor $Red
        }
        
        Write-Host "Safety Lock: " -NoNewline
        if ($emergency.controls.safetyLock) {
            Write-Host "ACTIVE" -ForegroundColor $Red
        } else {
            Write-Host "INACTIVE" -ForegroundColor $Green
        }
        
        Write-Host "Allowed Symbols: $($emergency.controls.allowedSymbols -join ', ')"
        
        if ($emergency.controls.sessionWindow) {
            Write-Host "Session Window: $($emergency.controls.sessionWindow.start) - $($emergency.controls.sessionWindow.end)"
        }
        
        Write-Host "`n" -NoNewline
    }
    
    # Recommendations
    Write-Host "RECOMMENDATIONS" -ForegroundColor $Blue
    Write-Host "-" * 15 -ForegroundColor $Blue
    
    if ($performance) {
        $summary = $performance.summary
        
        if ($summary.profitFactor -lt 1.1) {
            Write-Host "• Profit Factor is below 1.1 - consider strategy adjustments" -ForegroundColor $Yellow
        }
        
        if ($summary.maxDD -gt 0.05) {
            Write-Host "• Max Drawdown exceeds 5% - review risk management" -ForegroundColor $Red
        }
        
        if ($summary.winRate -lt 0.4) {
            Write-Host "• Win Rate is below 40% - review entry/exit criteria" -ForegroundColor $Yellow
        }
        
        if ($summary.totalTrades -lt 10) {
            Write-Host "• Low trade count - may need more market opportunities" -ForegroundColor $Yellow
        }
    }
    
    if ($emergency -and $emergency.controls.safetyLock) {
        Write-Host "• Safety lock is active - trading is disabled" -ForegroundColor $Red
    }
    
    if ($production -and $production.exchange.status -ne "connected") {
        Write-Host "• Exchange connection issues - check network and API keys" -ForegroundColor $Red
    }
    
    Write-Host "`n" -NoNewline
    
    # Next Steps
    Write-Host "NEXT STEPS" -ForegroundColor $Green
    Write-Host "-" * 12 -ForegroundColor $Green
    Write-Host "1. Review performance metrics above"
    Write-Host "2. Check system health indicators"
    Write-Host "3. Verify safety controls are appropriate"
    Write-Host "4. Plan adjustments for tomorrow if needed"
    Write-Host "5. Update journal with lessons learned"
    Write-Host "6. Ensure backup procedures are working"
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor $Blue
    Write-Host "End of Daily Report" -ForegroundColor $Blue
    Write-Host "=" * 60 -ForegroundColor $Blue
}

# Main execution
New-DailyReport
