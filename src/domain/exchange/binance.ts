import crypto from 'crypto';
import { Exchange, PlaceOrderInput, Order, Position, Balance, OrderStatus } from './types';

const BASE_URL = 'https://api.binance.com';
const TESTNET_URL = 'https://testnet.binance.vision';

function createSignature(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

function createTimestamp(): number {
  return Date.now();
}

export function createBinanceExchange(): Exchange {
  const apiKey = process.env.BINANCE_API_KEY!;
  const apiSecret = process.env.BINANCE_SECRET_KEY!;
  const useTestnet = process.env.BINANCE_USE_TESTNET === 'true';
  const baseUrl = useTestnet ? TESTNET_URL : BASE_URL;

  return {
    async placeOrder(input: PlaceOrderInput): Promise<{ id: string }> {
      const timestamp = createTimestamp();
      const params = new URLSearchParams({
        symbol: input.symbol,
        side: input.side.toUpperCase(),
        type: input.type.toUpperCase(),
        quantity: input.qty.toString(),
        timestamp: timestamp.toString(),
      });

      if (input.price) {
        params.append('price', input.price.toString());
      }

      const signature = createSignature(params.toString(), apiSecret);
      params.append('signature', signature);

      const response = await fetch(`${baseUrl}/api/v3/order`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Binance API error: ${error.msg || 'Unknown error'}`);
      }

      const data = await response.json();
      return { id: data.orderId.toString() };
    },

    async cancelOrder(id: string): Promise<void> {
      const timestamp = createTimestamp();
      const params = new URLSearchParams({
        orderId: id,
        timestamp: timestamp.toString(),
      });

      const signature = createSignature(params.toString(), apiSecret);
      params.append('signature', signature);

      const response = await fetch(`${baseUrl}/api/v3/order`, {
        method: 'DELETE',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Binance API error: ${error.msg || 'Unknown error'}`);
      }
    },

    async getOrder(id: string): Promise<Order> {
      const timestamp = createTimestamp();
      const params = new URLSearchParams({
        orderId: id,
        timestamp: timestamp.toString(),
      });

      const signature = createSignature(params.toString(), apiSecret);
      params.append('signature', signature);

      const response = await fetch(`${baseUrl}/api/v3/order?${params.toString()}`, {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Binance API error: ${error.msg || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        id: data.orderId.toString(),
        symbol: data.symbol,
        side: data.side.toLowerCase() as 'buy' | 'sell',
        qty: parseFloat(data.origQty),
        price: parseFloat(data.price),
        status: data.status as OrderStatus,
        timestamp: data.time,
      };
    },

    async getPositions(): Promise<Position[]> {
      // Binance spot doesn't have positions like futures
      // Return empty array for now
      return [];
    },

    async getBalance(): Promise<Balance[]> {
      const timestamp = createTimestamp();
      const params = new URLSearchParams({
        timestamp: timestamp.toString(),
      });

      const signature = createSignature(params.toString(), apiSecret);
      params.append('signature', signature);

      const response = await fetch(`${baseUrl}/api/v3/account?${params.toString()}`, {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Binance API error: ${error.msg || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.balances.map((balance: any) => ({
        asset: balance.asset,
        free: parseFloat(balance.free),
        locked: parseFloat(balance.locked),
      }));
    },

    async getExchangeInfo(): Promise<any> {
      const response = await fetch(`${baseUrl}/api/v3/exchangeInfo`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange info');
      }
      return response.json();
    },
  };
}
