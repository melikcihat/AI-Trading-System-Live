"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyController = void 0;
const apiKey_js_1 = require("../models/apiKey.js");
const encryption_js_1 = require("../utils/encryption.js");
class ApiKeyController {
    static async getApiKeys(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const apiKeys = await apiKey_js_1.ApiKeyModel.findByUserId(req.user.id);
            // Don't return encrypted data, just metadata
            const safeApiKeys = apiKeys.map(key => ({
                id: key.id,
                exchange: key.exchange,
                created_at: key.created_at
            }));
            res.json({ apiKeys: safeApiKeys });
        }
        catch (error) {
            console.error('Get API keys error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async addApiKey(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const { exchange, apiKey, apiSecret } = req.body;
            if (!exchange || !apiKey || !apiSecret) {
                return res.status(400).json({ error: 'Exchange, API key, and API secret are required' });
            }
            // Encrypt the API credentials
            const encryptedApiKey = (0, encryption_js_1.encrypt)(apiKey);
            const encryptedApiSecret = (0, encryption_js_1.encrypt)(apiSecret);
            const newApiKey = await apiKey_js_1.ApiKeyModel.create(req.user.id, exchange, encryptedApiKey, encryptedApiSecret);
            res.status(201).json({
                message: 'API key added successfully',
                apiKey: {
                    id: newApiKey.id,
                    exchange: newApiKey.exchange,
                    created_at: newApiKey.created_at
                }
            });
        }
        catch (error) {
            console.error('Add API key error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async deleteApiKey(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const { id } = req.params;
            const apiKeyId = parseInt(id);
            if (isNaN(apiKeyId)) {
                return res.status(400).json({ error: 'Invalid API key ID' });
            }
            const deleted = await apiKey_js_1.ApiKeyModel.delete(apiKeyId, req.user.id);
            if (!deleted) {
                return res.status(404).json({ error: 'API key not found' });
            }
            res.json({ message: 'API key deleted successfully' });
        }
        catch (error) {
            console.error('Delete API key error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ApiKeyController = ApiKeyController;
//# sourceMappingURL=apiKeyController.js.map