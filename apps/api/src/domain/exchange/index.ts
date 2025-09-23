import { Exchange } from './types';
import { createMockExchange } from './mock';
import { createBinanceExchange } from './binance';

export function createExchange(kind: 'mock' | 'binance'): Exchange {
  switch (kind) {
    case 'mock':
      return createMockExchange();
    case 'binance':
      return createBinanceExchange();
    default:
      throw new Error(`Unsupported exchange: ${kind}`);
  }
}

export function getCurrentExchange(): Exchange {
  const exchangeType = process.env.EXCHANGE || 'mock';
  return createExchange(exchangeType as 'mock' | 'binance');
}
