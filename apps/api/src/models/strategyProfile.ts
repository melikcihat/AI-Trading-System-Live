import { Pool } from 'pg';
import { StrategyProfile } from '../domain/strategy/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/app'
});

export interface StrategyProfileDB {
  id: number;
  user_id: number;
  name: string;
  symbol: string;
  timeframe: string;
  strategies: any;
  aggregate_rule: string;
  priority_order: any;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createStrategyProfile(profile: Omit<StrategyProfile, 'id' | 'updatedAt'>): Promise<StrategyProfileDB> {
  const query = `
    INSERT INTO strategy_profiles (user_id, name, symbol, timeframe, strategies, aggregate_rule, priority_order, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    profile.userId,
    profile.name,
    profile.symbol,
    profile.timeframe,
    JSON.stringify(profile.strategies),
    profile.aggregateRule,
    JSON.stringify(profile.priorityOrder),
    profile.active
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getStrategyProfiles(userId: number): Promise<StrategyProfileDB[]> {
  const query = 'SELECT * FROM strategy_profiles WHERE user_id = $1 ORDER BY updated_at DESC';
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getStrategyProfile(id: number, userId: number): Promise<StrategyProfileDB | null> {
  const query = 'SELECT * FROM strategy_profiles WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function updateStrategyProfile(id: number, userId: number, updates: Partial<StrategyProfile>): Promise<StrategyProfileDB | null> {
  const setClause = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.name !== undefined) {
    setClause.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.symbol !== undefined) {
    setClause.push(`symbol = $${paramCount++}`);
    values.push(updates.symbol);
  }
  if (updates.timeframe !== undefined) {
    setClause.push(`timeframe = $${paramCount++}`);
    values.push(updates.timeframe);
  }
  if (updates.strategies !== undefined) {
    setClause.push(`strategies = $${paramCount++}`);
    values.push(JSON.stringify(updates.strategies));
  }
  if (updates.aggregateRule !== undefined) {
    setClause.push(`aggregate_rule = $${paramCount++}`);
    values.push(updates.aggregateRule);
  }
  if (updates.priorityOrder !== undefined) {
    setClause.push(`priority_order = $${paramCount++}`);
    values.push(JSON.stringify(updates.priorityOrder));
  }
  if (updates.active !== undefined) {
    setClause.push(`active = $${paramCount++}`);
    values.push(updates.active);
  }
  
  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  
  values.push(id, userId);
  
  const query = `
    UPDATE strategy_profiles 
    SET ${setClause.join(', ')}
    WHERE id = $${paramCount++} AND user_id = $${paramCount++}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

export async function deleteStrategyProfile(id: number, userId: number): Promise<boolean> {
  const query = 'DELETE FROM strategy_profiles WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}

export async function activateStrategyProfile(id: number, userId: number): Promise<StrategyProfileDB | null> {
  // First deactivate all profiles for this user
  await pool.query('UPDATE strategy_profiles SET active = false WHERE user_id = $1', [userId]);
  
  // Then activate the selected profile
  const query = `
    UPDATE strategy_profiles 
    SET active = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function getActiveStrategyProfile(userId: number): Promise<StrategyProfileDB | null> {
  const query = 'SELECT * FROM strategy_profiles WHERE user_id = $1 AND active = true';
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}
