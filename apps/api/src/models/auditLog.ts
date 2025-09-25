import pool from './database';

export interface AuditLog {
  id?: number;
  userId?: number;
  action: string;
  summary: string;
  payload?: any;
  createdAt?: Date;
}

export async function createAuditLog(log: AuditLog): Promise<void> {
  const query = `
    INSERT INTO audit_logs (user_id, action, summary, payload)
    VALUES ($1, $2, $3, $4)
  `;
  
  const values = [log.userId, log.action, log.summary, log.payload ? JSON.stringify(log.payload) : null];
  await pool.query(query, values);
}

export async function getAuditLogs(limit: number = 100, userId?: number): Promise<AuditLog[]> {
  let query = 'SELECT * FROM audit_logs';
  const values: any[] = [];
  
  if (userId) {
    query += ' WHERE user_id = $1';
    values.push(userId);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1);
  values.push(limit);
  
  const result = await pool.query(query, values);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    summary: row.summary,
    payload: row.payload,
    createdAt: row.created_at
  }));
}
