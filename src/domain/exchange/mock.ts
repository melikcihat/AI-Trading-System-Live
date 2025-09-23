import { Exchange, Order, Position, Balance, PlaceOrderInput, OrderStatus } from './types';

export function createMockExchange(): Exchange {
  const orders: Order[] = [];
  const positions: Position[] = [];
  let orderIdCounter = 1;
  let positionIdCounter = 1;

  return {
    async placeOrder(input: PlaceOrderInput): Promise<{ id: string }> {
      const order: Order = {
        id: `order_${orderIdCounter++}`,
        symbol: input.symbol,
        side: input.side,
        price: input.price || 0,
        qty: input.qty,
        status: 'FILLED', // Mock exchange fills immediately
        timestamp: Date.now()
      };
      
      orders.push(order);
      
      // Create position for filled order
      const position: Position = {
        id: `pos_${positionIdCounter++}`,
        symbol: input.symbol,
        side: input.side,
        entry: input.price || 0,
        qty: input.qty,
        notional: (input.price || 0) * input.qty,
        status: 'OPEN',
        openedAt: Date.now()
      };
      
      positions.push(position);
      
      return { id: order.id };
    },

    async cancelOrder(id: string): Promise<void> {
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = 'CANCELED';
      }
    },

    async getOrder(id: string): Promise<Order> {
      const order = orders.find(o => o.id === id);
      if (!order) {
        throw new Error(`Order ${id} not found`);
      }
      return order;
    },

    async getPositions(): Promise<Position[]> {
      return positions.filter(p => p.status === 'OPEN');
    },

    async getBalance(): Promise<Balance[]> {
      return [
        { asset: 'USDT', free: 10000, locked: 0 },
        { asset: 'BTC', free: 0.1, locked: 0 }
      ];
    },

    async getExchangeInfo(): Promise<any> {
      return {
        serverTime: Date.now(),
        symbols: [
          {
            symbol: 'BTCUSDT',
            status: 'TRADING',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            filters: [
              { filterType: 'LOT_SIZE', minQty: '0.00001', maxQty: '9000.00000000', stepSize: '0.00001' },
              { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '1000000.00', tickSize: '0.01' },
              { filterType: 'MIN_NOTIONAL', minNotional: '10.00000000' }
            ]
          }
        ]
      };
    }
  };
}
