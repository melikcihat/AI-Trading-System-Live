import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/app'
});

export interface AlertTemplate {
  id: number;
  key: string;
  channel: 'TELEGRAM' | 'DISCORD';
  templateText: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAlertTemplates(): Promise<AlertTemplate[]> {
  const query = 'SELECT * FROM alert_templates WHERE enabled = true ORDER BY key, channel';
  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    key: row.key,
    channel: row.channel,
    templateText: row.template_text,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getAlertTemplate(key: string, channel: string): Promise<AlertTemplate | null> {
  const query = 'SELECT * FROM alert_templates WHERE key = $1 AND channel = $2 AND enabled = true';
  const result = await pool.query(query, [key, channel]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    key: row.key,
    channel: row.channel,
    templateText: row.template_text,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateAlertTemplate(id: number, templateText: string): Promise<AlertTemplate | null> {
  const query = `
    UPDATE alert_templates 
    SET template_text = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [templateText, id]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    key: row.key,
    channel: row.channel,
    templateText: row.template_text,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
