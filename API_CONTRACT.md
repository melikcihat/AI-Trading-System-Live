# API Contract - HubAI Trader

## Authentication Endpoints

### POST /api/auth/register
```json
{
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

### POST /api/auth/login
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /api/auth/logout
Headers: Authorization: Bearer <token>

## Trading Endpoints

### GET /api/trading/pairs
Returns available trading pairs

### POST /api/trading/analyze
```json
{
  "pair": "string",
  "timeframe": "string"
}
```

### GET /api/trading/signals
Returns AI trading signals

### POST /api/trading/positions
```json
{
  "pair": "string",
  "side": "buy|sell",
  "amount": "number",
  "price": "number"
}
```

## Exchange Integration

### POST /api/exchange/connect
```json
{
  "apiKey": "string",
  "apiSecret": "string",
  "exchange": "bitget"
}
```

### GET /api/exchange/balance
Returns account balance

### GET /api/exchange/orders
Returns open orders

## News & Analysis

### GET /api/news/latest
Returns latest crypto news

### POST /api/news/sentiment
```json
{
  "text": "string"
}
```

## WebSocket Events

### /ws/trading
- price_update
- signal_generated
- position_opened
- position_closed

### /ws/news
- news_alert
- sentiment_update
