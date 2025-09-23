import pool from './database.js';

export interface ApiKey {
  id: number;
  user_id: number;
  exchange: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  created_at: Date;
  updated_at: Date;
}

export class ApiKeyModel {
  static async create(
    userId: number, 
    exchange: string, 
    apiKeyEncrypted: string, 
    apiSecretEncrypted: string
  ): Promise<ApiKey> {
    const query = `
      INSERT INTO api_keys (user_id, exchange, api_key_encrypted, api_secret_encrypted, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [userId, exchange, apiKeyEncrypted, apiSecretEncrypted]);
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<ApiKey[]> {
    const query = 'SELECT * FROM api_keys WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM api_keys WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }
}
