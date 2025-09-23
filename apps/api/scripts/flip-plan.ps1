# 10-Minute Flip Plan Script
# Usage: .\flip-plan.ps1 [shadow|flip|monitor|report]

param(
    [string]$Action = "shadow",
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

# Step 1: Verify Mode and Limits
function Test-ModeAndLimits {
    Log-Info "Step 1: Verifying mode and limits..."
    
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/production/status"
        
        # Check testnet mode
        if ($response.environment.isTestnet) {
            Log-Warning "BINANCE_TESTNET=true (shadow mode - will flip to false in step 4)"
        } else {
            Log-Success "BINANCE_TESTNET=false (live mode)"
        }
        
        # Check emergency status
        $emergency = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        
        if ($emergency.controls.safetyLock) {
            Log-Success "SAFETY_LOCK=true (shadow mode active)"
        } else {
            Log-Warning "SAFETY_LOCK=false (live mode active)"
        }
        
        # Check allowed symbols
        if ($emergency.controls.allowedSymbols -contains "BTCUSDT") {
            Log-Success "BTCUSDT is in allowed symbols"
        } else {
            Log-Error "BTCUSDT not in allowed symbols"
        }
        
        Log-Success "Mode and limits verification completed"
        
    } catch {
        Log-Error "Failed to verify mode and limits: $($_.Exception.Message)"
        exit 1
    }
}

# Step 2: Start Shadow Testing
function Start-ShadowTesting {
    Log-Info "Step 2: Starting shadow testing (15-30 minutes)..."
    
    try {
        # Ensure safety lock is on
        $body = @{
            safetyLock = $true
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
        }
        if ($JwtToken) {
            $headers["Authorization"] = "Bearer $JwtToken"
        }
        
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/controls" -Method Put -Body $body -Headers $headers
        
        if ($response.success) {
            Log-Success "SAFETY_LOCK=true activated for shadow testing"
        } else {
            Log-Error "Failed to activate safety lock"
            exit 1
        }
        
        # Test signal generation
        Log-Info "Testing signal generation..."
        $signalBody = @{
            closes = @(100, 101, 102, 103, 102, 101, 100, 99, 98, 97, 98, 99, 101, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118)
            params = @{
                fast = 9
                slow = 21
                rsi = 55
            }
        } | ConvertTo-Json

        $signalResponse = Invoke-RestMethod -Uri "https://$Domain/api/signal" -Method Post -Body $signalBody -ContentType "application/json"
        
        if ($signalResponse.signal) {
            Log-Success "Signal generation working: $($signalResponse.signal.side)"
        } else {
            Log-Warning "Signal generation returned no signal"
        }
        
        # Test alerts
        Log-Info "Testing alert system..."
        $alertResponse = Invoke-RestMethod -Uri "https://$Domain/api/alerts/test" -Method Post
        
        if ($alertResponse.success) {
            Log-Success "Alert system working"
        } else {
            Log-Warning "Alert system test failed"
        }
        
        Log-Success "Shadow testing started - monitor for 15-30 minutes"
        Log-Info "Watch for:"
        Write-Host "  - Signal generation (should be working)"
        Write-Host "  - Alert delivery (check Telegram/Discord)"
        Write-Host "  - No critical errors in logs"
        Write-Host "  - WebSocket connectivity stable"
        
    } catch {
        Log-Error "Shadow testing failed: $($_.Exception.Message)"
        exit 1
    }
}

# Step 3: Flip to Live
function Start-FlipToLive {
    Log-Info "Step 3: Flipping to live mode..."
    
    try {
        # Disable safety lock
        $body = @{
            safetyLock = $false
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
        }
        if ($JwtToken) {
            $headers["Authorization"] = "Bearer $JwtToken"
        }
        
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/controls" -Method Put -Body $body -Headers $headers
        
        if ($response.success) {
            Log-Success "SAFETY_LOCK=false - LIVE TRADING ENABLED"
        } else {
            Log-Error "Failed to disable safety lock"
            exit 1
        }
        
        # Test order validation
        Log-Info "Testing order validation..."
        $orderBody = @{
            symbol = "BTCUSDT"
            qty = 0.001
            price = 50000
        } | ConvertTo-Json

        $orderResponse = Invoke-RestMethod -Uri "https://$Domain/api/production/validate-order" -Method Post -Body $orderBody -ContentType "application/json"
        
        if ($orderResponse.validation.valid) {
            Log-Success "Order validation passed"
        } else {
            Log-Warning "Order validation failed: $($orderResponse.validation.errors -join ', ')"
        }
        
        Log-Success "Live mode activated - ready for min notional orders"
        Log-Warning "Next: Place 1 market + 1 limit order with min notional"
        
    } catch {
        Log-Error "Flip to live failed: $($_.Exception.Message)"
        exit 1
    }
}

# Step 4: Monitor Key Indicators
function Start-Monitoring {
    Log-Info "Step 4: Starting live monitoring..."
    
    $monitoringDuration = 300 # 5 minutes
    $startTime = Get-Date
    
    Log-Info "Monitoring for $($monitoringDuration/60) minutes..."
    Log-Info "Key indicators to watch:"
    Write-Host "  1. Profit Factor (gün-içi): > 1.1"
    Write-Host "  2. Max Drawdown (gün-içi): < 1%"
    Write-Host "  3. Error budget: 5xx+timeout < 0.1%"
    Write-Host "  4. WS reconnect count: < 3/hour"
    Write-Host "  5. Slippage average: < 10-20 bps"
    Write-Host "  6. Alert delay: < 10 seconds"
    
    while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($monitoringDuration)) {
        try {
            # Get performance summary
            $performance = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary" -ErrorAction SilentlyContinue
            
            if ($performance) {
                $summary = $performance.summary
                Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Performance:" -ForegroundColor $Blue
                Write-Host "  PnL: $$($summary.totalPnL.ToString('F2'))" -ForegroundColor $(if($summary.totalPnL -ge 0) {$Green} else {$Red})
                Write-Host "  PF: $($summary.profitFactor.ToString('F2'))" -ForegroundColor $(if($summary.profitFactor -gt 1.1) {$Green} else {$Yellow})
                Write-Host "  MaxDD: $($summary.maxDD.ToString('P1'))" -ForegroundColor $(if($summary.maxDD -lt 0.01) {$Green} else {$Red})
                Write-Host "  Win Rate: $($summary.winRate.ToString('P1'))"
                Write-Host "  Trades: $($summary.totalTrades)"
            }
            
            # Get production status
            $status = Invoke-RestMethod -Uri "https://$Domain/api/production/status" -ErrorAction SilentlyContinue
            
            if ($status) {
                Write-Host "  Exchange: $($status.exchange.status)" -ForegroundColor $(if($status.exchange.status -eq 'connected') {$Green} else {$Red})
                Write-Host "  Trading: $($status.safety.tradingAllowed)" -ForegroundColor $(if($status.safety.tradingAllowed) {$Green} else {$Red})
            }
            
        } catch {
            Log-Warning "Monitoring check failed: $($_.Exception.Message)"
        }
        
        Start-Sleep -Seconds 30
    }
    
    Log-Success "Monitoring completed"
}

# Step 5: Generate Report
function New-FlipReport {
    Log-Info "Step 5: Generating flip report..."
    
    try {
        # Get performance data
        $performance = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary"
        $status = Invoke-RestMethod -Uri "https://$Domain/api/production/status"
        $emergency = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        
        $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        Write-Host "`n" -NoNewline
        Write-Host "=" * 60 -ForegroundColor $Blue
        Write-Host "FLIP REPORT - $date" -ForegroundColor $Blue
        Write-Host "=" * 60 -ForegroundColor $Blue
        Write-Host "`n" -NoNewline
        
        # KPI Section
        Write-Host "KPI METRICS" -ForegroundColor $Green
        Write-Host "-" * 12 -ForegroundColor $Green
        
        $summary = $performance.summary
        Write-Host "Total PnL: " -NoNewline
        if ($summary.totalPnL -ge 0) {
            Write-Host "$$($summary.totalPnL.ToString('F2'))" -ForegroundColor $Green
        } else {
            Write-Host "$$($summary.totalPnL.ToString('F2'))" -ForegroundColor $Red
        }
        
        Write-Host "Profit Factor: $($summary.profitFactor.ToString('F2'))" -ForegroundColor $(if($summary.profitFactor -gt 1.1) {$Green} else {$Yellow})
        Write-Host "Win Rate: $($summary.winRate.ToString('P1'))"
        Write-Host "Max Drawdown: $($summary.maxDD.ToString('P1'))" -ForegroundColor $(if($summary.maxDD -lt 0.01) {$Green} else {$Red})
        Write-Host "Best Trade: $$($summary.bestTrade.ToString('F2'))" -ForegroundColor $Green
        Write-Host "Worst Trade: $$($summary.worstTrade.ToString('F2'))" -ForegroundColor $Red
        Write-Host "Avg Trade: $$($summary.avgTrade.ToString('F2'))"
        Write-Host "Total Trades: $($summary.totalTrades)"
        
        Write-Host "`n" -NoNewline
        
        # Technical Section
        Write-Host "TECHNICAL METRICS" -ForegroundColor $Blue
        Write-Host "-" * 18 -ForegroundColor $Blue
        
        Write-Host "Exchange Status: $($status.exchange.status)" -ForegroundColor $(if($status.exchange.status -eq 'connected') {$Green} else {$Red})
        Write-Host "Trading Allowed: $($status.safety.tradingAllowed)" -ForegroundColor $(if($status.safety.tradingAllowed) {$Green} else {$Red})
        Write-Host "Safety Lock: $($emergency.controls.safetyLock)" -ForegroundColor $(if($emergency.controls.safetyLock) {$Red} else {$Green})
        Write-Host "Testnet Mode: $($status.environment.isTestnet)" -ForegroundColor $(if($status.environment.isTestnet) {$Yellow} else {$Green})
        
        Write-Host "`n" -NoNewline
        
        # Risk Assessment
        Write-Host "RISK ASSESSMENT" -ForegroundColor $Yellow
        Write-Host "-" * 15 -ForegroundColor $Yellow
        
        $riskLevel = "LOW"
        $riskColor = $Green
        
        if ($summary.profitFactor -lt 1.1) {
            $riskLevel = "MEDIUM"
            $riskColor = $Yellow
            Write-Host "⚠️  Profit Factor below 1.1" -ForegroundColor $Yellow
        }
        
        if ($summary.maxDD -gt 0.01) {
            $riskLevel = "HIGH"
            $riskColor = $Red
            Write-Host "🚨 Max Drawdown above 1%" -ForegroundColor $Red
        }
        
        if ($summary.totalTrades -lt 3) {
            Write-Host "⚠️  Low trade count - need more data" -ForegroundColor $Yellow
        }
        
        Write-Host "Overall Risk Level: $riskLevel" -ForegroundColor $riskColor
        
        Write-Host "`n" -NoNewline
        
        # Recommendations
        Write-Host "RECOMMENDATIONS" -ForegroundColor $Blue
        Write-Host "-" * 15 -ForegroundColor $Blue
        
        if ($summary.profitFactor -gt 1.2 -and $summary.maxDD -lt 0.005) {
            Write-Host "✅ Ready for Day 2 (2% notional)" -ForegroundColor $Green
        } elseif ($summary.profitFactor -gt 1.1 -and $summary.maxDD -lt 0.01) {
            Write-Host "✅ Ready for Day 2 (2% notional)" -ForegroundColor $Green
        } else {
            Write-Host "⚠️  Stay on Day 1 (1% notional) - improve metrics first" -ForegroundColor $Yellow
        }
        
        Write-Host "`n" -NoNewline
        Write-Host "=" * 60 -ForegroundColor $Blue
        Write-Host "End of Flip Report" -ForegroundColor $Blue
        Write-Host "=" * 60 -ForegroundColor $Blue
        
    } catch {
        Log-Error "Failed to generate report: $($_.Exception.Message)"
    }
}

# Main execution
switch ($Action.ToLower()) {
    "shadow" {
        Test-ModeAndLimits
        Start-ShadowTesting
    }
    "flip" {
        Start-FlipToLive
    }
    "monitor" {
        Start-Monitoring
    }
    "report" {
        New-FlipReport
    }
    "full" {
        Test-ModeAndLimits
        Start-ShadowTesting
        Write-Host "`nWaiting 30 seconds before flip..." -ForegroundColor $Yellow
        Start-Sleep -Seconds 30
        Start-FlipToLive
        Start-Monitoring
        New-FlipReport
    }
    default {
        Write-Host "Usage: .\flip-plan.ps1 [shadow|flip|monitor|report|full]"
        Write-Host "  shadow  - Start shadow testing"
        Write-Host "  flip    - Flip to live mode"
        Write-Host "  monitor - Monitor key indicators"
        Write-Host "  report  - Generate flip report"
        Write-Host "  full    - Run complete flip plan"
    }
}
