import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/app'
});

export interface TradeExecution {
  id: number;
  userId: number;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  fee: number;
  ts: Date;
  strategy?: string;
  profileId?: number;
  createdAt: Date;
}

export async function createTradeExecution(data: {
  userId: number;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  fee?: number;
  ts: Date;
  strategy?: string;
  profileId?: number;
}): Promise<TradeExecution> {
  const query = `
    INSERT INTO trade_executions (user_id, symbol, side, qty, price, fee, ts, strategy, profile_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const values = [
    data.userId,
    data.symbol,
    data.side,
    data.qty,
    data.price,
    data.fee || 0,
    data.ts,
    data.strategy,
    data.profileId
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    side: row.side,
    qty: parseFloat(row.qty),
    price: parseFloat(row.price),
    fee: parseFloat(row.fee),
    ts: row.ts,
    strategy: row.strategy,
    profileId: row.profile_id,
    createdAt: row.created_at
  };
}

export async function getTradeExecutions(
  userId: number,
  symbol?: string,
  fromDate?: Date,
  toDate?: Date,
  limit?: number
): Promise<TradeExecution[]> {
  let query = 'SELECT * FROM trade_executions WHERE user_id = $1';
  const values: any[] = [userId];
  let paramIndex = 1;
  
  if (symbol) {
    paramIndex++;
    query += ` AND symbol = $${paramIndex}`;
    values.push(symbol);
  }
  
  if (fromDate) {
    paramIndex++;
    query += ` AND ts >= $${paramIndex}`;
    values.push(fromDate);
  }
  
  if (toDate) {
    paramIndex++;
    query += ` AND ts <= $${paramIndex}`;
    values.push(toDate);
  }
  
  query += ' ORDER BY ts DESC';
  
  if (limit) {
    paramIndex++;
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);
  }
  
  const result = await pool.query(query, values);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    side: row.side,
    qty: parseFloat(row.qty),
    price: parseFloat(row.price),
    fee: parseFloat(row.fee),
    ts: row.ts,
    strategy: row.strategy,
    profileId: row.profile_id,
    createdAt: row.created_at
  }));
}

export async function getTradeStats(
  userId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<{
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgTrade: number;
}> {
  let query = `
    SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN (side = 'buy' AND qty > 0) OR (side = 'sell' AND qty < 0) THEN 1 ELSE 0 END) as winning_trades,
      SUM(CASE WHEN (side = 'buy' AND qty < 0) OR (side = 'sell' AND qty > 0) THEN 1 ELSE 0 END) as losing_trades,
      SUM(qty * price - fee) as total_pnl,
      MAX(qty * price - fee) as best_trade,
      MIN(qty * price - fee) as worst_trade,
      AVG(qty * price - fee) as avg_trade
    FROM trade_executions 
    WHERE user_id = $1
  `;
  
  const values: any[] = [userId];
  let paramIndex = 1;
  
  if (fromDate) {
    paramIndex++;
    query += ` AND ts >= $${paramIndex}`;
    values.push(fromDate);
  }
  
  if (toDate) {
    paramIndex++;
    query += ` AND ts <= $${paramIndex}`;
    values.push(toDate);
  }
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    totalTrades: parseInt(row.total_trades) || 0,
    winningTrades: parseInt(row.winning_trades) || 0,
    losingTrades: parseInt(row.losing_trades) || 0,
    totalPnL: parseFloat(row.total_pnl) || 0,
    bestTrade: parseFloat(row.best_trade) || 0,
    worstTrade: parseFloat(row.worst_trade) || 0,
    avgTrade: parseFloat(row.avg_trade) || 0
  };
}
