import { Router } from 'express';
import { getBinanceWebSocketService } from '../infra/market-data/binance-ws';

const router = Router();
const wsService = getBinanceWebSocketService();

// Start WebSocket connection
wsService.connect();

router.get('/status', (req, res) => {
  const isConnected = wsService.listenerCount('connected') > 0;
  res.json({ 
    connected: isConnected,
    exchange: process.env.EXCHANGE || 'mock'
  });
});

router.post('/subscribe/kline', (req, res) => {
  try {
    const { symbol, interval } = req.body;
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'symbol and interval required' });
    }
    
    wsService.subscribeKline(symbol, interval);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

router.post('/subscribe/ticker', (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }
    
    wsService.subscribeTicker(symbol);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

export default router;
