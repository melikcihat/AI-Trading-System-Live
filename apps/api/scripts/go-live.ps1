# GO-LIVE PowerShell Script
# Usage: .\go-live.ps1 [testnet|mainnet] [pilot|day2|day3]

param(
    [string]$Mode = "testnet",
    [string]$Day = "pilot",
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

# Check if domain is accessible
function Test-Domain {
    Log-Info "Checking domain accessibility..."
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain/api/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Log-Success "Domain $Domain is accessible"
        } else {
            Log-Error "Domain $Domain returned status $($response.StatusCode)"
            exit 1
        }
    } catch {
        Log-Error "Domain $Domain is not accessible: $($_.Exception.Message)"
        exit 1
    }
}

# Check production status
function Test-ProductionStatus {
    Log-Info "Checking production status..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/production/status"
        if ($response.status -eq "ok") {
            Log-Success "Production status: OK"
        } else {
            Log-Error "Production status: FAILED"
            $response | ConvertTo-Json
            exit 1
        }
    } catch {
        Log-Error "Production status check failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run pre-flight checks
function Test-PreflightChecks {
    Log-Info "Running pre-flight checks..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/production/pre-flight"
        if ($response.status -eq "ready") {
            Log-Success "Pre-flight checks: READY"
        } else {
            Log-Warning "Pre-flight checks: NOT READY"
            if ($response.recommendations) {
                $response.recommendations | ForEach-Object { Write-Host "  - $_" }
            }
        }
    } catch {
        Log-Error "Pre-flight checks failed: $($_.Exception.Message)"
    }
}

# Test order validation
function Test-OrderValidation {
    Log-Info "Testing order validation..."
    try {
        $body = @{
            symbol = "BTCUSDT"
            qty = 0.001
            price = 50000
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "https://$Domain/api/production/validate-order" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.validation.valid) {
            Log-Success "Order validation: PASSED"
        } else {
            Log-Warning "Order validation: FAILED"
            $response.validation.errors | ForEach-Object { Write-Host "  - $_" }
        }
    } catch {
        Log-Error "Order validation test failed: $($_.Exception.Message)"
    }
}

# Test alerts
function Test-Alerts {
    Log-Info "Testing alerts..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/alerts/test" -Method Post
        if ($response.success) {
            Log-Success "Alert test: PASSED"
        } else {
            Log-Warning "Alert test: FAILED"
        }
    } catch {
        Log-Error "Alert test failed: $($_.Exception.Message)"
    }
}

# Check emergency status
function Test-EmergencyStatus {
    Log-Info "Checking emergency status..."
    try {
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/status"
        
        if ($response.controls.safetyLock) {
            Log-Warning "Safety lock is ACTIVE (trading disabled)"
        } else {
            Log-Success "Safety lock is INACTIVE (trading enabled)"
        }
        
        if ($response.isTradingAllowed) {
            Log-Success "Trading is ALLOWED"
        } else {
            Log-Warning "Trading is BLOCKED"
        }
    } catch {
        Log-Error "Emergency status check failed: $($_.Exception.Message)"
    }
}

# Set environment configuration
function Set-Environment {
    param([string]$Mode, [string]$Day)
    
    Log-Info "Setting environment for $Mode mode, day $Day..."
    
    switch ($Day) {
        "pilot" {
            Log-Info "Setting PILOT configuration..."
            Write-Host "MAX_ORDER_NOTIONAL_PCT=0.01"
            Write-Host "DAILY_LOSS_LIMIT_PCT=0.01"
            Write-Host "MAX_RISK_PCT=0.005"
        }
        "day2" {
            Log-Info "Setting DAY 2 configuration..."
            Write-Host "MAX_ORDER_NOTIONAL_PCT=0.02"
            Write-Host "DAILY_LOSS_LIMIT_PCT=0.015"
            Write-Host "MAX_RISK_PCT=0.005"
        }
        "day3" {
            Log-Info "Setting DAY 3 configuration..."
            Write-Host "MAX_ORDER_NOTIONAL_PCT=0.03"
            Write-Host "DAILY_LOSS_LIMIT_PCT=0.02"
            Write-Host "MAX_RISK_PCT=0.005"
        }
    }
    
    if ($Mode -eq "mainnet") {
        Write-Host "BINANCE_TESTNET=false"
    } else {
        Write-Host "BINANCE_TESTNET=true"
    }
}

# Emergency functions
function Invoke-PanicStop {
    Log-Warning "Activating PANIC STOP..."
    try {
        $headers = @{}
        if ($JwtToken) {
            $headers["Authorization"] = "Bearer $JwtToken"
        }
        
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/panic-stop" -Method Post -Headers $headers
        
        if ($response.success) {
            Log-Success "Panic stop activated"
        } else {
            Log-Error "Panic stop failed"
        }
    } catch {
        Log-Error "Panic stop failed: $($_.Exception.Message)"
    }
}

function Invoke-PartialStop {
    param([string]$Symbols)
    
    Log-Warning "Activating PARTIAL STOP for symbols: $Symbols..."
    try {
        $body = @{
            symbols = $Symbols.Split(",")
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
        }
        if ($JwtToken) {
            $headers["Authorization"] = "Bearer $JwtToken"
        }
        
        $response = Invoke-RestMethod -Uri "https://$Domain/api/emergency/partial-stop" -Method Post -Body $body -Headers $headers
        
        if ($response.success) {
            Log-Success "Partial stop activated for $Symbols"
        } else {
            Log-Error "Partial stop failed"
        }
    } catch {
        Log-Error "Partial stop failed: $($_.Exception.Message)"
    }
}

# Main execution
function Start-GoLive {
    param([string]$Mode, [string]$Day)
    
    Log-Info "Starting GO-LIVE process for $Mode mode, day $Day"
    
    # Pre-flight checks
    Test-Domain
    Test-ProductionStatus
    Test-PreflightChecks
    Test-OrderValidation
    Test-Alerts
    Test-EmergencyStatus
    
    # Set environment
    Set-Environment $Mode $Day
    
    Log-Success "GO-LIVE checks completed!"
    Log-Info "Next steps:"
    Write-Host "1. Review all checks above"
    Write-Host "2. Set environment variables as shown"
    Write-Host "3. Restart the application"
    Write-Host "4. Monitor for 15-30 minutes with SAFETY_LOCK=true"
    Write-Host "5. If metrics are green, set SAFETY_LOCK=false"
    Write-Host "6. Start with small orders"
    
    Log-Info "Emergency commands:"
    Write-Host "- Panic stop: .\go-live.ps1 -Mode panic"
    Write-Host "- Partial stop: .\go-live.ps1 -Mode partial -Day 'BTCUSDT'"
}

# Handle emergency commands
switch ($Mode.ToLower()) {
    "panic" {
        Invoke-PanicStop
    }
    "partial" {
        Invoke-PartialStop $Day
    }
    default {
        Start-GoLive $Mode $Day
    }
}
