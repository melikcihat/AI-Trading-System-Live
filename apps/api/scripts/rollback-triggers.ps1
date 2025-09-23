# Rollback Triggers Script
# Usage: .\rollback-triggers.ps1 [check|setup]

param(
    [string]$Action = "check",
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

# Check rollback triggers
function Test-RollbackTriggers {
    Log-Info "Checking rollback triggers..."
    
    try {
        # Get performance data
        $performance = Invoke-RestMethod -Uri "https://$Domain/api/performance/summary"
        $emergency = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        
        $triggers = @()
        $summary = $performance.summary
        
        # Trigger 1: Daily loss limit hit
        if ($summary.totalPnL -lt -($summary.totalPnL * 0.01)) {
            $triggers += "Daily loss limit hit (PnL: $$($summary.totalPnL.ToString('F2')))"
        }
        
        # Trigger 2: 3 consecutive losses (simplified check)
        if ($summary.winRate -lt 0.3 -and $summary.totalTrades -ge 3) {
            $triggers += "Low win rate detected ($($summary.winRate.ToString('P1')))"
        }
        
        # Trigger 3: High drawdown
        if ($summary.maxDD -gt 0.01) {
            $triggers += "Max drawdown exceeded 1% ($($summary.maxDD.ToString('P1')))"
        }
        
        # Check if safety lock is already active
        if ($emergency.controls.safetyLock) {
            $triggers += "Safety lock already active"
        }
        
        if ($triggers.Count -gt 0) {
            Log-Warning "Rollback triggers detected:"
            foreach ($trigger in $triggers) {
                Write-Host "  🚨 $trigger" -ForegroundColor $Red
            }
            
            # Auto-rollback if critical triggers
            if ($summary.maxDD -gt 0.01 -or $summary.totalPnL -lt -100) {
                Log-Warning "Critical triggers detected - initiating auto-rollback..."
                Invoke-AutoRollback
            }
        } else {
            Log-Success "No rollback triggers detected - system stable"
        }
        
    } catch {
        Log-Error "Failed to check rollback triggers: $($_.Exception.Message)"
    }
}

# Auto-rollback function
function Invoke-AutoRollback {
    Log-Warning "Initiating auto-rollback..."
    
    try {
        # Activate safety lock
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
            Log-Success "Safety lock activated - trading disabled"
        } else {
            Log-Error "Failed to activate safety lock"
        }
        
        # Partial stop for BTCUSDT
        $partialBody = @{
            symbols = @("BTCUSDT")
        } | ConvertTo-Json

        $partialResponse = Invoke-RestMethod -Uri "https://$Domain/api/emergency/partial-stop" -Method Post -Body $partialBody -Headers $headers
        
        if ($partialResponse.success) {
            Log-Success "Partial stop activated for BTCUSDT"
        } else {
            Log-Error "Failed to activate partial stop"
        }
        
        # Send emergency alert
        $alertBody = @{
            type = "EMERGENCY_ROLLBACK"
            message = "Auto-rollback triggered due to risk limits"
        } | ConvertTo-Json

        try {
            Invoke-RestMethod -Uri "https://$Domain/api/alerts/emergency" -Method Post -Body $alertBody -ContentType "application/json" -ErrorAction SilentlyContinue
            Log-Success "Emergency alert sent"
        } catch {
            Log-Warning "Failed to send emergency alert"
        }
        
        Log-Success "Auto-rollback completed"
        
    } catch {
        Log-Error "Auto-rollback failed: $($_.Exception.Message)"
    }
}

# Setup rollback monitoring
function Set-RollbackMonitoring {
    Log-Info "Setting up rollback monitoring..."
    
    # Create monitoring script
    $monitoringScript = @"
# Rollback Monitoring Script
# Runs every 5 minutes to check triggers

param([string]`$Domain = "localhost:8000")

try {
    `$performance = Invoke-RestMethod -Uri "https://`$Domain/api/performance/summary"
    `$emergency = Invoke-RestMethod -Uri "https://`$Domain/api/emergency/status"
    
    `$summary = `$performance.summary
    
    # Check triggers
    if (`$summary.maxDD -gt 0.01) {
        Write-Host "ROLLBACK TRIGGER: Max DD > 1%"
        # Activate safety lock
        Invoke-RestMethod -Uri "https://`$Domain/api/emergency/controls" -Method Put -Body '{"safetyLock":true}' -ContentType "application/json"
    }
    
    if (`$summary.totalPnL -lt -100) {
        Write-Host "ROLLBACK TRIGGER: Daily loss limit"
        # Activate safety lock
        Invoke-RestMethod -Uri "https://`$Domain/api/emergency/controls" -Method Put -Body '{"safetyLock":true}' -ContentType "application/json"
    }
    
} catch {
    Write-Host "Monitoring check failed: `$(`$_.Exception.Message)"
}
"@

    $monitoringScript | Out-File -FilePath "rollback-monitor.ps1" -Encoding UTF8
    
    Log-Success "Rollback monitoring script created: rollback-monitor.ps1"
    Log-Info "To set up automatic monitoring:"
    Write-Host "  - Run: .\rollback-monitor.ps1"
    Write-Host "  - Set up Windows Task Scheduler to run every 5 minutes"
    Write-Host "  - Or use cron job on Linux/Mac"
}

# Main execution
switch ($Action.ToLower()) {
    "check" {
        Test-RollbackTriggers
    }
    "setup" {
        Set-RollbackMonitoring
    }
    "rollback" {
        Invoke-AutoRollback
    }
    default {
        Write-Host "Usage: .\rollback-triggers.ps1 [check|setup|rollback]"
        Write-Host "  check    - Check current rollback triggers"
        Write-Host "  setup    - Set up rollback monitoring"
        Write-Host "  rollback - Manually trigger rollback"
    }
}
