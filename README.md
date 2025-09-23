# HubAI Trader - AI-Powered Cryptocurrency Trading Platform

🚀 **Professional AI trading platform with advanced risk management, backtesting, and live trading capabilities.**

## 🌟 Features

### Core Trading
- **AI Signal Generation**: EMA/RSI, Donchian Breakout, Bollinger Mean Reversion
- **Multi-Strategy Aggregation**: Priority and Majority voting systems
- **Real-time Risk Management**: Position sizing, stop-loss, take-profit
- **Live Trading**: Binance integration with safety guards

### Advanced Analytics
- **Backtesting Engine**: Historical performance analysis
- **Grid-Search Optimization**: Parameter optimization
- **Walk-Forward Analysis**: Out-of-sample validation
- **Performance Dashboard**: Real-time metrics and equity curves

### Risk & Safety
- **Emergency Controls**: Panic stop, partial stop, safety lock
- **Daily Loss Limits**: Automatic trading halt on losses
- **Idempotency**: Duplicate order prevention
- **Audit Logging**: Complete trading history

### User Experience
- **Strategy Profiles**: Multiple strategy configurations
- **Trade Journal**: Tagged trade notes and analysis
- **Alert System**: Telegram/Discord notifications
- **Responsive UI**: Modern React + Tailwind CSS

## 🏗️ Architecture

```
├── apps/
│   ├── api/          # Node.js/Express backend
│   └── web/          # React frontend
├── src/
│   ├── domain/       # Business logic
│   ├── models/       # Database models
│   ├── routes/       # API endpoints
│   └── middleware/   # Express middleware
└── scripts/          # Deployment & utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Binance API keys

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/hubai-trader.git
cd hubai-trader
```

2. **Install dependencies**
```bash
npm install
cd apps/api && npm install
cd ../web && npm install
```

3. **Environment setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your settings
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_secret
DATABASE_URL=postgresql://user:pass@localhost:5432/hubai_trader
```

4. **Database setup**
```bash
cd apps/api
npm run migrate
```

5. **Start development servers**
```bash
# Backend (Terminal 1)
cd apps/api
npm run dev

# Frontend (Terminal 2)
cd apps/web
npm run dev
```

6. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 📊 Trading Features

### Strategy Library
- **EMA/RSI Crossover**: Trend following with momentum
- **Donchian Breakout**: Channel breakout strategy
- **Bollinger Mean Reversion**: Mean reversion with volatility

### Risk Management
- **Position Sizing**: Kelly criterion and fixed percentage
- **Stop Loss/Take Profit**: Automatic exit management
- **Daily Loss Limits**: Configurable risk controls
- **Symbol Restrictions**: Whitelist/blacklist management

### Performance Analytics
- **Real-time Metrics**: PnL, win rate, max drawdown
- **Equity Curves**: Visual performance tracking
- **Monthly Heatmaps**: Return visualization
- **Trade Analysis**: Detailed trade breakdowns

## 🔧 Configuration

### Environment Variables

```bash
# Exchange Configuration
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_secret
BINANCE_TESTNET=true

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Risk Management
MAX_ORDER_NOTIONAL_PCT=0.01
DAILY_LOSS_LIMIT_PCT=0.01
SAFETY_LOCK=false

# Alerts
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
DISCORD_WEBHOOK_URL=your_webhook_url
```

### Strategy Configuration

```typescript
// Example strategy profile
{
  "name": "BTCUSDT Conservative",
  "symbol": "BTCUSDT",
  "timeframe": "5m",
  "strategies": [
    {
      "key": "EMA_RSI",
      "params": { "fast": 9, "slow": 21, "rsi": 55 }
    }
  ],
  "aggregateRule": "PRIORITY",
  "priorityOrder": ["EMA_RSI"]
}
```

## 🚨 Safety Features

### Emergency Controls
- **Panic Stop**: Immediate halt of all trading
- **Partial Stop**: Stop specific symbols
- **Safety Lock**: Disable trading system-wide
- **Session Windows**: Time-based trading restrictions

### Risk Monitoring
- **Real-time PnL**: Live profit/loss tracking
- **Drawdown Alerts**: Automatic notifications
- **Error Budget**: System reliability monitoring
- **WebSocket Health**: Connection monitoring

## 📈 Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Railway (Backend)
```bash
# Connect GitHub repository
# Configure environment variables
# Deploy automatically on push
```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security

- **API Key Encryption**: AES-256 encryption
- **JWT Authentication**: Secure user sessions
- **Rate Limiting**: API abuse prevention
- **Input Validation**: SQL injection protection
- **Audit Logging**: Complete action history

## 📊 API Documentation

### Core Endpoints

```bash
# Signal Generation
POST /api/signal
{
  "closes": [100, 101, 102, ...],
  "params": { "fast": 9, "slow": 21, "rsi": 55 }
}

# Backtesting
POST /api/backtest
{
  "closes": [...],
  "params": {...},
  "feesBps": 8,
  "slippageBps": 5
}

# Performance
GET /api/performance/summary
GET /api/performance/curve
GET /api/performance/heatmap

# Emergency Controls
POST /api/emergency/panic-stop
POST /api/emergency/partial-stop
PUT /api/emergency/controls
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**This software is for educational and research purposes only. Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee future results. Use at your own risk.**

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hubai-trader/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hubai-trader/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/hubai-trader/wiki)

---

**Built with ❤️ for the trading community**