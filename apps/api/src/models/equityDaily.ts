import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/app'
});

export interface EquityDaily {
  id: number;
  userId: number;
  date: Date;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  createdAt: Date;
}

export async function createEquityDaily(data: {
  userId: number;
  date: Date;
  equity: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
}): Promise<EquityDaily> {
  const query = `
    INSERT INTO equity_daily (user_id, date, equity, realized_pnl, unrealized_pnl)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      equity = EXCLUDED.equity,
      realized_pnl = EXCLUDED.realized_pnl,
      unrealized_pnl = EXCLUDED.unrealized_pnl
    RETURNING *
  `;
  
  const values = [
    data.userId,
    data.date,
    data.equity,
    data.realizedPnl || 0,
    data.unrealizedPnl || 0
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    equity: parseFloat(row.equity),
    realizedPnl: parseFloat(row.realized_pnl),
    unrealizedPnl: parseFloat(row.unrealized_pnl),
    createdAt: row.created_at
  };
}

export async function getEquityDaily(
  userId: number, 
  fromDate?: Date, 
  toDate?: Date
): Promise<EquityDaily[]> {
  let query = 'SELECT * FROM equity_daily WHERE user_id = $1';
  const values: any[] = [userId];
  
  if (fromDate) {
    query += ' AND date >= $2';
    values.push(fromDate);
  }
  
  if (toDate) {
    const paramIndex = values.length + 1;
    query += ` AND date <= $${paramIndex}`;
    values.push(toDate);
  }
  
  query += ' ORDER BY date ASC';
  
  const result = await pool.query(query, values);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    equity: parseFloat(row.equity),
    realizedPnl: parseFloat(row.realized_pnl),
    unrealizedPnl: parseFloat(row.unrealized_pnl),
    createdAt: row.created_at
  }));
}

export async function getLatestEquity(userId: number): Promise<EquityDaily | null> {
  const query = `
    SELECT * FROM equity_daily 
    WHERE user_id = $1 
    ORDER BY date DESC 
    LIMIT 1
  `;
  
  const result = await pool.query(query, [userId]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    equity: parseFloat(row.equity),
    realizedPnl: parseFloat(row.realized_pnl),
    unrealizedPnl: parseFloat(row.unrealized_pnl),
    createdAt: row.created_at
  };
}
