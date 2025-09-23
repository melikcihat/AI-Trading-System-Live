#!/bin/bash

# GO-LIVE Script
# Usage: ./go-live.sh [testnet|mainnet] [pilot|day2|day3]

set -e

DOMAIN=${DOMAIN:-"localhost:8000"}
JWT_TOKEN=${JWT_TOKEN:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if domain is accessible
check_domain() {
    log_info "Checking domain accessibility..."
    if curl -s --max-time 10 "https://$DOMAIN/api/health" > /dev/null; then
        log_success "Domain $DOMAIN is accessible"
    else
        log_error "Domain $DOMAIN is not accessible"
        exit 1
    fi
}

# Check production status
check_production_status() {
    log_info "Checking production status..."
    response=$(curl -s "https://$DOMAIN/api/production/status")
    
    if echo "$response" | grep -q '"status":"ok"'; then
        log_success "Production status: OK"
    else
        log_error "Production status: FAILED"
        echo "$response"
        exit 1
    fi
}

# Run pre-flight checks
run_preflight_checks() {
    log_info "Running pre-flight checks..."
    response=$(curl -s "https://$DOMAIN/api/production/pre-flight")
    
    if echo "$response" | grep -q '"status":"ready"'; then
        log_success "Pre-flight checks: READY"
    else
        log_warning "Pre-flight checks: NOT READY"
        echo "$response" | jq '.recommendations[]' 2>/dev/null || echo "$response"
    fi
}

# Test order validation
test_order_validation() {
    log_info "Testing order validation..."
    response=$(curl -s -X POST "https://$DOMAIN/api/production/validate-order" \
        -H "Content-Type: application/json" \
        -d '{"symbol":"BTCUSDT","qty":0.001,"price":50000}')
    
    if echo "$response" | grep -q '"valid":true'; then
        log_success "Order validation: PASSED"
    else
        log_warning "Order validation: FAILED"
        echo "$response"
    fi
}

# Test alerts
test_alerts() {
    log_info "Testing alerts..."
    response=$(curl -s -X POST "https://$DOMAIN/api/alerts/test")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Alert test: PASSED"
    else
        log_warning "Alert test: FAILED"
        echo "$response"
    fi
}

# Check emergency status
check_emergency_status() {
    log_info "Checking emergency status..."
    response=$(curl -s "https://$DOMAIN/api/emergency/status")
    
    safety_lock=$(echo "$response" | jq -r '.controls.safetyLock' 2>/dev/null)
    trading_allowed=$(echo "$response" | jq -r '.isTradingAllowed' 2>/dev/null)
    
    if [ "$safety_lock" = "true" ]; then
        log_warning "Safety lock is ACTIVE (trading disabled)"
    else
        log_success "Safety lock is INACTIVE (trading enabled)"
    fi
    
    if [ "$trading_allowed" = "true" ]; then
        log_success "Trading is ALLOWED"
    else
        log_warning "Trading is BLOCKED"
    fi
}

# Set environment configuration
set_environment() {
    local mode=$1
    local day=$2
    
    log_info "Setting environment for $mode mode, day $day..."
    
    case $day in
        "pilot")
            log_info "Setting PILOT configuration..."
            echo "MAX_ORDER_NOTIONAL_PCT=0.01"
            echo "DAILY_LOSS_LIMIT_PCT=0.01"
            echo "MAX_RISK_PCT=0.005"
            ;;
        "day2")
            log_info "Setting DAY 2 configuration..."
            echo "MAX_ORDER_NOTIONAL_PCT=0.02"
            echo "DAILY_LOSS_LIMIT_PCT=0.015"
            echo "MAX_RISK_PCT=0.005"
            ;;
        "day3")
            log_info "Setting DAY 3 configuration..."
            echo "MAX_ORDER_NOTIONAL_PCT=0.03"
            echo "DAILY_LOSS_LIMIT_PCT=0.02"
            echo "MAX_RISK_PCT=0.005"
            ;;
    esac
    
    if [ "$mode" = "mainnet" ]; then
        echo "BINANCE_TESTNET=false"
    else
        echo "BINANCE_TESTNET=true"
    fi
}

# Emergency functions
panic_stop() {
    log_warning "Activating PANIC STOP..."
    if [ -n "$JWT_TOKEN" ]; then
        response=$(curl -s -X POST "https://$DOMAIN/api/emergency/panic-stop" \
            -H "Authorization: Bearer $JWT_TOKEN")
    else
        response=$(curl -s -X POST "https://$DOMAIN/api/emergency/panic-stop")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Panic stop activated"
    else
        log_error "Panic stop failed"
        echo "$response"
    fi
}

partial_stop() {
    local symbols=$1
    log_warning "Activating PARTIAL STOP for symbols: $symbols..."
    
    if [ -n "$JWT_TOKEN" ]; then
        response=$(curl -s -X POST "https://$DOMAIN/api/emergency/partial-stop" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "{\"symbols\":[\"$symbols\"]}")
    else
        response=$(curl -s -X POST "https://$DOMAIN/api/emergency/partial-stop" \
            -H "Content-Type: application/json" \
            -d "{\"symbols\":[\"$symbols\"]}")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Partial stop activated for $symbols"
    else
        log_error "Partial stop failed"
        echo "$response"
    fi
}

# Main execution
main() {
    local mode=${1:-"testnet"}
    local day=${2:-"pilot"}
    
    log_info "Starting GO-LIVE process for $mode mode, day $day"
    
    # Pre-flight checks
    check_domain
    check_production_status
    run_preflight_checks
    test_order_validation
    test_alerts
    check_emergency_status
    
    # Set environment
    set_environment "$mode" "$day"
    
    log_success "GO-LIVE checks completed!"
    log_info "Next steps:"
    echo "1. Review all checks above"
    echo "2. Set environment variables as shown"
    echo "3. Restart the application"
    echo "4. Monitor for 15-30 minutes with SAFETY_LOCK=true"
    echo "5. If metrics are green, set SAFETY_LOCK=false"
    echo "6. Start with small orders"
    
    log_info "Emergency commands:"
    echo "- Panic stop: ./go-live.sh panic"
    echo "- Partial stop: ./go-live.sh partial BTCUSDT"
}

# Handle emergency commands
case $1 in
    "panic")
        panic_stop
        ;;
    "partial")
        partial_stop "$2"
        ;;
    *)
        main "$@"
        ;;
esac
