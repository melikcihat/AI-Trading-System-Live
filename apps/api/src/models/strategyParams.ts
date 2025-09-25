import pool from './database';

export interface StrategyParams {
  id?: number;
  userId: number;
  fast: number;
  slow: number;
  rsi: number;
  stopDistPct: number;
  rr: number;
  updatedAt?: Date;
}

export async function getStrategyParams(userId: number): Promise<StrategyParams | null> {
  const query = 'SELECT * FROM user_strategy_params WHERE user_id = $1';
  const result = await pool.query(query, [userId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    fast: row.fast,
    slow: row.slow,
    rsi: row.rsi,
    stopDistPct: row.stop_dist_pct,
    rr: row.rr,
    updatedAt: row.updated_at
  };
}

export async function saveStrategyParams(params: StrategyParams): Promise<StrategyParams> {
  const query = `
    INSERT INTO user_strategy_params (user_id, fast, slow, rsi, stop_dist_pct, rr)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      fast = EXCLUDED.fast,
      slow = EXCLUDED.slow,
      rsi = EXCLUDED.rsi,
      stop_dist_pct = EXCLUDED.stop_dist_pct,
      rr = EXCLUDED.rr,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const values = [params.userId, params.fast, params.slow, params.rsi, params.stopDistPct, params.rr];
  const result = await pool.query(query, values);
  
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    fast: row.fast,
    slow: row.slow,
    rsi: row.rsi,
    stopDistPct: row.stop_dist_pct,
    rr: row.rr,
    updatedAt: row.updated_at
  };
}

export function validateStrategyParams(params: Partial<StrategyParams>): string[] {
  const errors: string[] = [];
  
  if (params.fast !== undefined) {
    if (params.fast < 5 || params.fast > 50) {
      errors.push('fast must be between 5 and 50');
    }
  }
  
  if (params.slow !== undefined) {
    if (params.slow < 10 || params.slow > 200) {
      errors.push('slow must be between 10 and 200');
    }
  }
  
  if (params.fast !== undefined && params.slow !== undefined) {
    if (params.fast >= params.slow) {
      errors.push('fast must be less than slow');
    }
  }
  
  if (params.rsi !== undefined) {
    if (params.rsi < 40 || params.rsi > 60) {
      errors.push('rsi must be between 40 and 60');
    }
  }
  
  if (params.stopDistPct !== undefined) {
    if (params.stopDistPct < 0.003 || params.stopDistPct > 0.05) {
      errors.push('stop_dist_pct must be between 0.003 and 0.05');
    }
  }
  
  if (params.rr !== undefined) {
    if (params.rr < 1 || params.rr > 5) {
      errors.push('rr must be between 1 and 5');
    }
  }
  
  return errors;
}
