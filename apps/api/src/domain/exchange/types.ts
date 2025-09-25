export type Side = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';

export interface PlaceOrderInput {
  symbol: string;
  side: Side;
  qty: number;
  price?: number;
  type: OrderType;
}

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  status: OrderStatus;
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  entry: number;
  qty: number;
  notional: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: number;
  closedAt?: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
}

export interface Exchange {
  placeOrder(input: PlaceOrderInput): Promise<{ id: string }>;
  cancelOrder(id: string): Promise<void>;
  getOrder(id: string): Promise<Order>;
  getPositions(): Promise<Position[]>;
  getBalance(): Promise<Balance[]>;
  getExchangeInfo(): Promise<any>;
}

export interface MarketData {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
}

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
