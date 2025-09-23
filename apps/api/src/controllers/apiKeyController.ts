import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ApiKeyModel } from '../models/apiKey.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export class ApiKeyController {
  static async getApiKeys(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const apiKeys = await ApiKeyModel.findByUserId(req.user.id);
      
      // Don't return encrypted data, just metadata
      const safeApiKeys = apiKeys.map(key => ({
        id: key.id,
        exchange: key.exchange,
        created_at: key.created_at
      }));

      res.json({ apiKeys: safeApiKeys });
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addApiKey(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { exchange, apiKey, apiSecret } = req.body;

      if (!exchange || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'Exchange, API key, and API secret are required' });
      }

      // Encrypt the API credentials
      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = encrypt(apiSecret);

      const newApiKey = await ApiKeyModel.create(
        req.user.id,
        exchange,
        encryptedApiKey,
        encryptedApiSecret
      );

      res.status(201).json({
        message: 'API key added successfully',
        apiKey: {
          id: newApiKey.id,
          exchange: newApiKey.exchange,
          created_at: newApiKey.created_at
        }
      });
    } catch (error) {
      console.error('Add API key error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteApiKey(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const apiKeyId = parseInt(id || '0');

      if (isNaN(apiKeyId)) {
        return res.status(400).json({ error: 'Invalid API key ID' });
      }

      const deleted = await ApiKeyModel.delete(apiKeyId, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'API key not found' });
      }

      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
