# Production Readiness Checklist

## A) Pre-Flight "Green Lights" (Shadow Testing)

### 1. Shadow Live Test (SAFETY_LOCK=true)
- [ ] Run for at least 50 trades with profitability metrics
- [ ] Profit Factor > 1.2
- [ ] Max DD < 10%
- [ ] Average slippage < 10-20 bps

### 2. Error Budget
- [ ] 5xx errors < 0.1% in 24 hours
- [ ] Timeout rate < 0.1%
- [ ] API response time p99 < 500ms

### 3. Alerts
- [ ] Order filled/canceled notifications working
- [ ] Risk-Block alerts working
- [ ] WebSocket reconnect alerts working
- [ ] Telegram/Discord integration tested

### 4. Backup & Recovery
- [ ] Database backup tested
- [ ] Restore procedure tested
- [ ] System can be brought back online from backup

## B) First Live Day Plan

### Limits (Conservative)
- [ ] MAX_ORDER_NOTIONAL_PCT = 0.01 (1% of capital)
- [ ] DAILY_LOSS_LIMIT_PCT = 0.01 (1% daily loss limit)
- [ ] riskPct <= 0.005 (0.5% risk per trade)
- [ ] Single instrument + timeframe (e.g., BTCUSDT, 5m)

### First 3 Orders
- [ ] Market orders with minimum quantity
- [ ] Immediate close/cancel capability
- [ ] Verify audit logs
- [ ] Verify alerts
- [ ] Check daily PnL

### End of Day
- [ ] Review Performance Dashboard
- [ ] Check PnL, maxDD, win-rate
- [ ] Review journal notes
- [ ] Verify all trades recorded

## C) Binance Filter & Precision

### Order Validation
- [ ] LOT_SIZE filter applied (minQty, maxQty, stepSize)
- [ ] PRICE_FILTER applied (minPrice, maxPrice, tickSize)
- [ ] MIN_NOTIONAL validation
- [ ] Quantity rounded to stepSize
- [ ] Price rounded to tickSize

### Idempotency
- [ ] TTL set to 60 seconds
- [ ] Duplicate requests rejected
- [ ] Second click protection active

### Time Synchronization
- [ ] NTP sync enabled
- [ ] System time accurate
- [ ] Signature timestamps valid
- [ ] WebSocket reconnection working

## D) Emergency Runbook

### Panic Stop
- [ ] SAFETY_LOCK=true activates immediately
- [ ] All open orders cancelled
- [ ] Positions closed if needed
- [ ] Emergency alerts sent

### Partial Stop
- [ ] Symbol-specific trading halt
- [ ] Individual symbol order cancellation
- [ ] Selective position management

### Maintenance Mode
- [ ] API returns 503 + retry-after
- [ ] UI shows red maintenance banner
- [ ] Graceful degradation

## E) Guardian Features

### Allowed Symbols
- [ ] Only approved pairs can be traded
- [ ] Symbol whitelist enforced
- [ ] New symbols require approval

### Session Window
- [ ] Trading only during specified hours
- [ ] High news periods blocked
- [ ] Timezone handling correct

### Correlation Limits
- [ ] Max 3+ positions in same direction
- [ ] Correlation calculation working
- [ ] Position limits enforced

### Shadow Hedging
- [ ] Hypothetical orders logged
- [ ] Deviation measurement active
- [ ] Performance comparison available

## F) Pre-Flight Checklist (Last 10 minutes)

### Environment
- [ ] Testnet → mainnet toggle correct
- [ ] .env.production secrets updated
- [ ] No unnecessary logging (masking enabled)
- [ ] CORS restricted to own domain

### Monitoring
- [ ] /metrics endpoint responding
- [ ] Uptime ping green
- [ ] Telegram/Discord test alert received
- [ ] Backup cron log shows today's dump

### Configuration
- [ ] Single active profile selected
- [ ] Safety controls configured
- [ ] Emergency contacts updated
- [ ] Runbook accessible

## API Endpoints for Monitoring

### Status Checks
- `GET /api/production/status` - Overall system status
- `GET /api/production/pre-flight` - Pre-flight checks
- `GET /api/emergency/status` - Emergency controls status

### Emergency Controls
- `POST /api/emergency/panic-stop` - Emergency stop
- `POST /api/emergency/partial-stop` - Partial stop
- `PUT /api/emergency/controls` - Update safety controls

### Validation
- `POST /api/production/validate-order` - Order validation test
- `GET /api/performance/summary` - Performance metrics

## Environment Variables

```bash
# Safety
SAFETY_LOCK=true
ALLOWED_SYMBOLS=BTCUSDT,ETHUSDT
SESSION_WINDOW={"start":"09:00","end":"17:00"}
MAX_CORRELATED_POSITIONS=3

# Exchange
BINANCE_TESTNET=true
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret

# Risk
MAX_ORDER_NOTIONAL_PCT=0.01
DAILY_LOSS_LIMIT_PCT=0.01
MAX_RISK_PCT=0.005

# Alerts
ALERTS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_token
DISCORD_WEBHOOK_URL=your_webhook
```

## Success Criteria

✅ All green lights from shadow testing
✅ Emergency controls tested and working
✅ Binance filters and validation working
✅ Alerts and monitoring active
✅ Backup and recovery procedures tested
✅ Conservative limits set for first day
✅ Single instrument focus
✅ End-to-end testing completed

**Only proceed to live trading when ALL items are checked!**
