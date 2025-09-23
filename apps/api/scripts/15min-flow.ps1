# 15-Minute Flow: Shadow → Flip → Monitor
# Usage: .\15min-flow.ps1

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

# Phase 1: Shadow Testing (5-10 minutes)
function Start-ShadowPhase {
    Log-Info "Phase 1: Shadow Testing (5-10 minutes)..."
    
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
            Log-Success "SAFETY_LOCK=true - Shadow mode active"
        } else {
            Log-Error "Failed to activate safety lock"
            return $false
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
            Log-Success "Signal generation: $($signalResponse.signal.side)"
        } else {
            Log-Warning "No signal generated"
        }
        
        # Test alerts
        Log-Info "Testing alert system..."
        $alertResponse = Invoke-RestMethod -Uri "https://$Domain/api/alerts/test" -Method Post
        
        if ($alertResponse.success) {
            Log-Success "Alert system working"
        } else {
            Log-Warning "Alert system test failed"
        }
        
        # Monitor for 5 minutes
        Log-Info "Monitoring shadow flow for 5 minutes..."
        $monitorDuration = 300 # 5 minutes
        $startTime = Get-Date
        
        while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($monitorDuration)) {
            try {
                $status = Invoke-RestMethod -Uri "https://$Domain/api/production/status" -ErrorAction SilentlyContinue
                $emergency = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status" -ErrorAction SilentlyContinue
                
                Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Shadow Status:" -ForegroundColor $Blue
                Write-Host "  Safety Lock: $($emergency.controls.safetyLock)" -ForegroundColor $(if($emergency.controls.safetyLock) {$Green} else {$Red})
                Write-Host "  Exchange: $($status.exchange.status)" -ForegroundColor $(if($status.exchange.status -eq 'connected') {$Green} else {$Red})
                Write-Host "  Trading: $($status.safety.tradingAllowed)" -ForegroundColor $(if($status.safety.tradingAllowed) {$Green} else {$Red})
                
            } catch {
                Log-Warning "Shadow monitoring check failed: $($_.Exception.Message)"
            }
            
            Start-Sleep -Seconds 30
        }
        
        Log-Success "Shadow phase completed"
        return $true
        
    } catch {
        Log-Error "Shadow phase failed: $($_.Exception.Message)"
        return $false
    }
}

# Phase 2: Flip to Live
function Start-FlipPhase {
    Log-Info "Phase 2: Flipping to Live..."
    
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
            Log-Success "SAFETY_LOCK=false - LIVE TRADING ENABLED!"
        } else {
            Log-Error "Failed to disable safety lock"
            return $false
        }
        
        # Test min notional order validation
        Log-Info "Testing min notional order validation..."
        $orderBody = @{
            symbol = "BTCUSDT"
            qty = 0.001
            price = 50000
        } | ConvertTo-Json

        $orderResponse = Invoke-RestMethod -Uri "https://$Domain/api/production/validate-order" -Method Post -Body $orderBody -ContentType "application/json"
        
        if ($orderResponse.validation.valid) {
            Log-Success "Min notional order validation: PASSED"
            Log-Info "Ready for: 1 market + 1 limit order (place→cancel)"
        } else {
            Log-Warning "Order validation issues: $($orderResponse.validation.errors -join ', ')"
        }
        
        Log-Success "Flip phase completed - Ready for live orders!"
        return $true
        
    } catch {
        Log-Error "Flip phase failed: $($_.Exception.Message)"
        return $false
    }
}

# Phase 3: Monitor (5 minutes)
function Start-MonitorPhase {
    Log-Info "Phase 3: Live Monitoring (5 minutes)..."
    
    $monitorDuration = 300 # 5 minutes
    $startTime = Get-Date
    
    Log-Info "Monitoring key indicators:"
    Write-Host "  - Profit Factor (gün-içi): > 1.1"
    Write-Host "  - Max Drawdown (gün-içi): < 1%"
    Write-Host "  - Error budget: 5xx+timeout < 0.1%"
    Write-Host "  - Alert delay: < 10 seconds"
    
    while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($monitorDuration)) {
        try {
            # Get performance data
            $performance = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary" -ErrorAction SilentlyContinue
            $status = Invoke-RestMethod -Uri "https://$Domain/api/production/status" -ErrorAction SilentlyContinue
            
            if ($performance) {
                $summary = $performance.summary
                Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Live Metrics:" -ForegroundColor $Blue
                Write-Host "  PnL: $$($summary.totalPnL.ToString('F2'))" -ForegroundColor $(if($summary.totalPnL -ge 0) {$Green} else {$Red})
                Write-Host "  PF: $($summary.profitFactor.ToString('F2'))" -ForegroundColor $(if($summary.profitFactor -gt 1.1) {$Green} else {$Yellow})
                Write-Host "  MaxDD: $($summary.maxDD.ToString('P1'))" -ForegroundColor $(if($summary.maxDD -lt 0.01) {$Green} else {$Red})
                Write-Host "  Win Rate: $($summary.winRate.ToString('P1'))"
                Write-Host "  Trades: $($summary.totalTrades)"
            }
            
            if ($status) {
                Write-Host "  Exchange: $($status.exchange.status)" -ForegroundColor $(if($status.exchange.status -eq 'connected') {$Green} else {$Red})
                Write-Host "  Trading: $($status.safety.tradingAllowed)" -ForegroundColor $(if($status.safety.tradingAllowed) {$Green} else {$Red})
            }
            
        } catch {
            Log-Warning "Monitoring check failed: $($_.Exception.Message)"
        }
        
        Start-Sleep -Seconds 30
    }
    
    Log-Success "Monitor phase completed"
}

# Phase 4: Journal Entry
function Add-JournalEntry {
    Log-Info "Phase 4: Adding journal entry..."
    
    try {
        $journalBody = @{
            symbol = "BTCUSDT"
            tags = @("go-live", "day-1", "min-notional")
            note = "Go-Live Day 1 - min notional test OK"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "https://$Domain/api/journal" -Method Post -Body $journalBody -ContentType "application/json"
        
        if ($response.id) {
            Log-Success "Journal entry added: ID $($response.id)"
        } else {
            Log-Warning "Journal entry may not have been saved"
        }
        
    } catch {
        Log-Warning "Failed to add journal entry: $($_.Exception.Message)"
    }
}

# Decision Tree
function Test-DecisionTree {
    Log-Info "Running decision tree..."
    
    try {
        $performance = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary"
        $summary = $performance.summary
        
        Write-Host "`n" -NoNewline
        Write-Host "DECISION TREE RESULTS" -ForegroundColor $Blue
        Write-Host "-" * 20 -ForegroundColor $Blue
        
        # Check conditions
        $pfOk = $summary.profitFactor -gt 1.1
        $ddOk = $summary.maxDD -lt 0.01
        
        Write-Host "Profit Factor: $($summary.profitFactor.ToString('F2')) " -NoNewline
        if ($pfOk) {
            Write-Host "✅" -ForegroundColor $Green
        } else {
            Write-Host "❌" -ForegroundColor $Red
        }
        
        Write-Host "Max Drawdown: $($summary.maxDD.ToString('P1')) " -NoNewline
        if ($ddOk) {
            Write-Host "✅" -ForegroundColor $Green
        } else {
            Write-Host "❌" -ForegroundColor $Red
        }
        
        Write-Host "`n" -NoNewline
        
        if ($pfOk -and $ddOk) {
            Log-Success "DECISION: Continue trading - conditions met"
            Write-Host "Ready for Day 2 upgrade criteria check" -ForegroundColor $Green
        } else {
            Log-Warning "DECISION: Review required - conditions not met"
            if (-not $pfOk) {
                Write-Host "  - PF ≤ 1.1 for 2+ hours → lock + review profile/params" -ForegroundColor $Yellow
            }
            if (-not $ddOk) {
                Write-Host "  - MaxDD ≥ 1% → lock + review profile/params" -ForegroundColor $Yellow
            }
        }
        
    } catch {
        Log-Error "Decision tree failed: $($_.Exception.Message)"
    }
}

# Main execution
function Start-15MinFlow {
    Log-Info "Starting 15-minute flow: Shadow → Flip → Monitor"
    
    # Phase 1: Shadow
    if (Start-ShadowPhase) {
        # Phase 2: Flip
        if (Start-FlipPhase) {
            # Phase 3: Monitor
            Start-MonitorPhase
            
            # Phase 4: Journal
            Add-JournalEntry
            
            # Decision Tree
            Test-DecisionTree
            
            Log-Success "15-minute flow completed!"
            Log-Info "Next: Check Day 2 upgrade criteria"
            
        } else {
            Log-Error "Flip phase failed - stopping flow"
        }
    } else {
        Log-Error "Shadow phase failed - stopping flow"
    }
}

# Execute 15-minute flow
Start-15MinFlow
