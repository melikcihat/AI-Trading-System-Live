import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/app'
});

export interface TradeJournal {
  id: number;
  userId: number;
  execId?: number;
  symbol: string;
  tags: string[];
  note?: string;
  screenshotUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createTradeJournal(data: {
  userId: number;
  execId?: number;
  symbol: string;
  tags?: string[];
  note?: string;
  screenshotUrl?: string;
}): Promise<TradeJournal> {
  const query = `
    INSERT INTO trade_journal (user_id, exec_id, symbol, tags, note, screenshot_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    data.userId,
    data.execId,
    data.symbol,
    data.tags || [],
    data.note,
    data.screenshotUrl
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    userId: row.user_id,
    execId: row.exec_id,
    symbol: row.symbol,
    tags: row.tags || [],
    note: row.note,
    screenshotUrl: row.screenshot_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getTradeJournal(
  userId: number,
  symbol?: string,
  tags?: string[],
  limit?: number
): Promise<TradeJournal[]> {
  let query = 'SELECT * FROM trade_journal WHERE user_id = $1';
  const values: any[] = [userId];
  let paramIndex = 1;
  
  if (symbol) {
    paramIndex++;
    query += ` AND symbol = $${paramIndex}`;
    values.push(symbol);
  }
  
  if (tags && tags.length > 0) {
    paramIndex++;
    query += ` AND tags && $${paramIndex}`;
    values.push(tags);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (limit) {
    paramIndex++;
    query += ` LIMIT $${paramIndex}`;
    values.push(limit);
  }
  
  const result = await pool.query(query, values);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    execId: row.exec_id,
    symbol: row.symbol,
    tags: row.tags || [],
    note: row.note,
    screenshotUrl: row.screenshot_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function updateTradeJournal(
  id: number,
  userId: number,
  updates: {
    tags?: string[];
    note?: string;
    screenshotUrl?: string;
  }
): Promise<TradeJournal | null> {
  const setClause = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.tags !== undefined) {
    setClause.push(`tags = $${paramCount++}`);
    values.push(updates.tags);
  }
  if (updates.note !== undefined) {
    setClause.push(`note = $${paramCount++}`);
    values.push(updates.note);
  }
  if (updates.screenshotUrl !== undefined) {
    setClause.push(`screenshot_url = $${paramCount++}`);
    values.push(updates.screenshotUrl);
  }
  
  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  
  values.push(id, userId);
  
  const query = `
    UPDATE trade_journal 
    SET ${setClause.join(', ')}
    WHERE id = $${paramCount++} AND user_id = $${paramCount++}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    execId: row.exec_id,
    symbol: row.symbol,
    tags: row.tags || [],
    note: row.note,
    screenshotUrl: row.screenshot_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function deleteTradeJournal(id: number, userId: number): Promise<boolean> {
  const query = 'DELETE FROM trade_journal WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}
