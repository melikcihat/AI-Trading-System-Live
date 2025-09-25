# HubAI Trader

AI-powered cryptocurrency trading platform with risk management and live market data integration.

## Features

- **Signal Generation**: EMA/RSI-based trading signals
- **Risk Management**: Position sizing, stop loss, take profit calculations
- **Backtesting**: Historical strategy performance analysis
- **Live Trading**: Real-time market data and order placement
- **Exchange Integration**: Binance API support with mock exchange for testing
- **Alerts**: Telegram and Discord notifications
- **Safety Controls**: Emergency stop, daily loss limits, position size limits

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL
- **Exchange**: Binance API (with testnet support)
- **Deployment**: Docker + Docker Compose

## Quick Start

### Development

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd hubai-trader
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp env.production.example .env.production
   # Edit .env.production with your API keys and settings
   ```

3. **Database setup**:
   ```bash
   # Start PostgreSQL
   docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16-alpine
   
   # Run migrations
   cd apps/api
   npm run migrate
   ```

4. **Start development servers**:
   ```bash
   # Backend
   cd apps/api
   npm run dev
   
   # Frontend (in another terminal)
   cd apps/web
   npm run dev
   ```

### Production Deployment

1. **Build and deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Configure domain**:
   - Update `deploy/caddy/Caddyfile` with your domain
   - Update `FRONTEND_ORIGIN` in `.env.production`

3. **SSL/TLS**:
   - Caddy automatically handles Let's Encrypt certificates
   - Ensure ports 80 and 443 are open

## Configuration

### Environment Variables

#### API Configuration
- `NODE_ENV`: production/development
- `PORT`: API server port (default: 8000)
- `JWT_SECRET`: JWT signing secret
- `SAFETY_LOCK`: Enable/disable trading (true/false)
- `DAILY_LOSS_LIMIT_PCT`: Daily loss limit (default: 0.03)
- `MAX_ORDER_NOTIONAL_PCT`: Max position size (default: 0.30)

#### Exchange Configuration
- `EXCHANGE`: binance/mock
- `BINANCE_API_KEY`: Binance API key
- `BINANCE_SECRET_KEY`: Binance secret key
- `BINANCE_USE_TESTNET`: Use testnet (true/false)

#### Alert Configuration
- `ALERTS_ENABLED`: Enable alerts (true/false)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHAT_ID`: Telegram chat ID
- `DISCORD_WEBHOOK_URL`: Discord webhook URL

## Security

- **API Keys**: Stored server-side only, never exposed to frontend
- **Safety Locks**: Multiple layers of trading protection
- **Rate Limiting**: API endpoint protection
- **HTTPS**: Enforced in production
- **Audit Logging**: All actions logged

## API Endpoints

### Health & Status
- `GET /api/health` - Health check
- `GET /api/market-data/status` - Connection status

### Trading
- `POST /api/signal` - Generate trading signal
- `POST /api/risk/preview` - Risk calculation
- `POST /api/risk/validate` - Risk validation
- `POST /api/orders` - Place order
- `DELETE /api/orders/:id` - Cancel order

### Strategy
- `GET /api/strategy/params` - Get strategy parameters
- `POST /api/strategy/params` - Update strategy parameters

### Backtesting
- `POST /api/backtest/run` - Run backtest

### Alerts & Monitoring
- `GET /api/alerts/status` - Alert configuration status
- `POST /api/alerts/test` - Send test alert
- `GET /api/audit` - Audit logs
- `GET /metrics` - Prometheus metrics

## Development

### Project Structure
```
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── domain/      # Business logic
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── models/      # Database models
│   │   │   ├── routes/      # API routes
│   │   │   └── utils/       # Utilities
│   │   └── Dockerfile
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/  # React components
│       │   └── App.tsx
│       └── Dockerfile
├── deploy/                  # Deployment configs
│   ├── nginx/              # Nginx config
│   └── caddy/              # Caddy config
└── docker-compose.prod.yml # Production compose
```

### Adding New Features

1. **Backend**: Add routes in `apps/api/src/routes/`
2. **Frontend**: Add components in `apps/web/src/components/`
3. **Database**: Add migrations in `migrations/`
4. **Tests**: Add tests in respective test directories

## Monitoring

- **Health Checks**: Built-in health endpoints
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Structured JSON logging
- **Audit**: All actions logged to database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the audit logs for debugging
