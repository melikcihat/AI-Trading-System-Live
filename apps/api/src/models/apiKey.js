"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyModel = void 0;
const database_js_1 = __importDefault(require("./database.js"));
class ApiKeyModel {
    static async create(userId, exchange, apiKeyEncrypted, apiSecretEncrypted) {
        const query = `
      INSERT INTO api_keys (user_id, exchange, api_key_encrypted, api_secret_encrypted, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
        const result = await database_js_1.default.query(query, [userId, exchange, apiKeyEncrypted, apiSecretEncrypted]);
        return result.rows[0];
    }
    static async findByUserId(userId) {
        const query = 'SELECT * FROM api_keys WHERE user_id = $1';
        const result = await database_js_1.default.query(query, [userId]);
        return result.rows;
    }
    static async delete(id, userId) {
        const query = 'DELETE FROM api_keys WHERE id = $1 AND user_id = $2';
        const result = await database_js_1.default.query(query, [id, userId]);
        return result.rowCount > 0;
    }
}
exports.ApiKeyModel = ApiKeyModel;
//# sourceMappingURL=apiKey.js.map