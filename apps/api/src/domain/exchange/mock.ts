export type Side = 'LONG' | 'SHORT';

export interface Order { 
  id: string; 
  side: Side; 
  price: number; 
  qty: number; 
  status: 'OPEN' | 'FILLED' | 'CANCELED'; 
  ts: number; 
}

export interface Position { 
  id: string; 
  side: Side; 
  entry: number; 
  qty: number; 
  notional: number; 
  status: 'OPEN' | 'CLOSED'; 
  openedAt: number; 
  closedAt?: number; 
}

export interface Exchange {
  createOrder(side: Side, qty: number, price: number): Order;
  cancelOrder(id: string): void;
  getOpenPositions(): Position[];
  getOrders(): Order[];
}

export function createMockExchange(): Exchange {
  const orders: Order[] = [];
  const positions: Position[] = [];
  let orderIdCounter = 1;
  let positionIdCounter = 1;

  return {
    createOrder(side: Side, qty: number, price: number): Order {
      const order: Order = {
        id: `order_${orderIdCounter++}`,
        side,
        price,
        qty,
        status: 'FILLED', // Mock exchange fills immediately
        ts: Date.now()
      };
      
      orders.push(order);
      
      // Create position for filled order
      const position: Position = {
        id: `pos_${positionIdCounter++}`,
        side,
        entry: price,
        qty,
        notional: price * qty,
        status: 'OPEN',
        openedAt: Date.now()
      };
      
      positions.push(position);
      
      return order;
    },

    cancelOrder(id: string): void {
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = 'CANCELED';
      }
    },

    getOpenPositions(): Position[] {
      return positions.filter(p => p.status === 'OPEN');
    },

    getOrders(): Order[] {
      return [...orders];
    }
  };
}
