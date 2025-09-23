# Test Plan - HubAI Trader

## Unit Tests

### Authentication Tests
- [ ] User registration with valid data
- [ ] User registration with invalid data
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] JWT token generation
- [ ] JWT token validation
- [ ] Password hashing

### API Endpoint Tests
- [ ] Health check endpoint
- [ ] Protected route access
- [ ] API key management
- [ ] Error handling
- [ ] CORS configuration

### Database Tests
- [ ] User creation
- [ ] User retrieval
- [ ] API key storage
- [ ] Data encryption/decryption

## Integration Tests

### API Integration
- [ ] End-to-end user registration flow
- [ ] End-to-end login flow
- [ ] API key management flow
- [ ] Error response handling

### Database Integration
- [ ] Database connection
- [ ] Migration execution
- [ ] Data persistence
- [ ] Transaction handling

## Smoke Tests

### Backend Smoke Test
```bash
# Test server startup
npm run dev
# Expected: Server running on port 3000

# Test health endpoint
curl http://localhost:3000/api/health
# Expected: {"status": "ok", "timestamp": "..."}
```

### Frontend Smoke Test
```bash
# Test React app startup
npm start
# Expected: App running on port 3001

# Test login page
curl http://localhost:3001
# Expected: HTML with login form
```

## Performance Tests

### Load Testing
- [ ] 100 concurrent users
- [ ] API response time < 200ms
- [ ] Database query performance
- [ ] Memory usage monitoring

## Security Tests

### Authentication Security
- [ ] Password strength validation
- [ ] JWT token expiration
- [ ] API key encryption
- [ ] SQL injection prevention
- [ ] XSS protection

## Signal Endpoint Tests

### Positive Test Cases
- [ ] LONG signal generation with valid data
- [ ] SHORT signal generation with valid data  
- [ ] NULL signal when no crossover detected
- [ ] Valid meta data returned (fastEma, slowEma, lastRsi)

### Negative Test Cases
- [ ] fast >= slow → 400 "fast must be < slow"
- [ ] closes.length < slow+2 → 400 "not enough bars"
- [ ] fast < 5 or > 50 → 400 "fast out of range"
- [ ] slow < 10 or > 200 → 400 "slow out of range"
- [ ] rsi < 40 or > 60 → 400 "rsi threshold out of range"
- [ ] NaN values in closes → 400 "non-finite close"
- [ ] Empty closes array → 400 "closes required"

### Rate Limiting Tests
- [ ] 60 requests per minute limit
- [ ] Rate limit exceeded returns 429

## Risk Calculation Tests

### Positive Test Cases
- [ ] LONG position sizing: entry=100, equity=1000, risk=0.01, stop=0.005 → qty≈20, SL=99.5, TP=101.0
- [ ] SHORT position sizing: SL and TP calculated correctly for short positions
- [ ] Risk validation passes with valid parameters
- [ ] Risk rules endpoint returns correct configuration

### Negative Test Cases
- [ ] stopDistPct < MIN_STOP_DIST_PCT → 400 "invalid stopDistPct"
- [ ] riskPct > MAX_RISK_PER_TRADE_PCT → validate ok:false "Risk per trade exceeds max"
- [ ] openPositionsCount >= MAX_POSITIONS → validate ok:false "Max open positions reached"
- [ ] todayRealizedLossPct <= -DAILY_LOSS_LIMIT_PCT → validate ok:false "Daily loss limit exceeded"
- [ ] Invalid side parameter → 400 "side required"

## Backtest Tests

### Positive Test Cases
- [ ] Basic backtest with sample data generates trades
- [ ] None→LONG→reverse→SHORT flow creates at least 2 trades
- [ ] Stop Loss/Take Profit exits work with stopDistPct/rr parameters
- [ ] Fees and slippage reduce PnL deterministically
- [ ] Equity curve calculation is correct
- [ ] Win rate and max drawdown metrics are accurate

### Negative Test Cases
- [ ] fast >= slow → 400 "fast must be < slow"
- [ ] closes.length < slow+2 → 400 "not enough bars"
- [ ] Invalid parameter ranges → 400 with specific error messages
- [ ] Non-finite values in closes → 400 "non-finite close"

### Mock Exchange Tests
- [ ] GET /api/positions returns open positions
- [ ] GET /api/orders returns order history
- [ ] Mock exchange creates positions for filled orders

## Live Trading Tests

### WebSocket Tests
- [ ] WebSocket connection establishes successfully
- [ ] Kline data subscription works (1m/5m/15m intervals)
- [ ] Ticker data subscription works
- [ ] Auto-reconnect after connection drop
- [ ] Heartbeat/ping-pong mechanism works

### Exchange Integration Tests
- [ ] Binance API connection with valid credentials
- [ ] Place market order successfully
- [ ] Place limit order successfully
- [ ] Cancel order successfully
- [ ] Get order status
- [ ] Get account balance
- [ ] Error handling for invalid API keys

### Security Tests
- [ ] API keys never exposed to frontend
- [ ] All API calls go through backend
- [ ] Rate limiting works for exchange calls
- [ ] Invalid credentials return proper errors

### UI Integration Tests
- [ ] Live trading tab shows connection status
- [ ] Symbol and interval selection works
- [ ] Signal generation with live data
- [ ] Risk preview integration
- [ ] Demo order placement works
- [ ] Real-time price updates

## Strategy & Safety Tests

### Strategy Parameter Tests
- [ ] Save strategy parameters with valid ranges
- [ ] Load saved strategy parameters
- [ ] Invalid parameter ranges return 400 errors
- [ ] Parameter validation enforces business rules

### Alert System Tests
- [ ] Test alert functionality sends to Telegram/Discord
- [ ] Alert status shows correct configuration
- [ ] Manual alert trigger works
- [ ] Audit logging for alert events

### Safety System Tests
- [ ] SAFETY_LOCK=true blocks all order placement
- [ ] Daily loss limit blocks orders when exceeded
- [ ] Max notional limit blocks oversized orders
- [ ] Safety violations are logged and alerted
- [ ] Emergency stop toggle works

### Order Flow Security Tests
- [ ] Idempotency prevents duplicate orders
- [ ] Concurrency lock prevents simultaneous orders for same symbol
- [ ] Rate limiting works for order placement
- [ ] All order events are audited
- [ ] Safety checks are enforced before order placement

## Browser Tests

### Chrome Extension
- [ ] Extension installation
- [ ] Content script injection
- [ ] Bitget page detection
- [ ] UI overlay display
- [ ] Data extraction

### Mobile PWA
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Push notifications
- [ ] Responsive design
