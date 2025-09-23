import { EventEmitter } from 'events';

export interface KlineData {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

export interface TickerData {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
  priceChange: number;
  priceChangePercent: number;
}

export class BinanceWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();

  constructor() {
    super();
  }

  connect(): void {
    const wsUrl = process.env.BINANCE_USE_TESTNET === 'true' 
      ? 'wss://testnet.binance.vision/ws'
      : 'wss://stream.binance.com:9443/ws';

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Binance WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.resubscribe();
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Binance WebSocket disconnected');
      this.stopHeartbeat();
      this.emit('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private handleMessage(data: any): void {
    if (data.e === 'kline') {
      const kline = this.parseKlineData(data);
      this.emit('kline', kline);
    } else if (data.e === '24hrTicker') {
      const ticker = this.parseTickerData(data);
      this.emit('ticker', ticker);
    } else if (data.e === 'ping') {
      this.sendPong();
    }
  }

  private parseKlineData(data: any): KlineData {
    const k = data.k;
    return {
      symbol: k.s,
      interval: k.i,
      openTime: k.t,
      closeTime: k.T,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      quoteVolume: parseFloat(k.q),
      trades: k.n,
      takerBuyBaseVolume: parseFloat(k.V),
      takerBuyQuoteVolume: parseFloat(k.Q),
    };
  }

  private parseTickerData(data: any): TickerData {
    return {
      symbol: data.s,
      price: parseFloat(data.c),
      timestamp: data.E,
      volume: parseFloat(data.v),
      priceChange: parseFloat(data.P),
      priceChangePercent: parseFloat(data.P),
    };
  }

  subscribeKline(symbol: string, interval: string): void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.subscriptions.add(stream);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription(stream);
    }
  }

  subscribeTicker(symbol: string): void {
    const stream = `${symbol.toLowerCase()}@ticker`;
    this.subscriptions.add(stream);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription(stream);
    }
  }

  private sendSubscription(stream: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [stream],
        id: Date.now(),
      }));
    }
  }

  private resubscribe(): void {
    for (const stream of this.subscriptions) {
      this.sendSubscription(stream);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'PING' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'PONG' }));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
let wsService: BinanceWebSocketService | null = null;

export function getBinanceWebSocketService(): BinanceWebSocketService {
  if (!wsService) {
    wsService = new BinanceWebSocketService();
  }
  return wsService;
}
