"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_js_1 = __importDefault(require("./database.js"));
class UserModel {
    static async create(email, passwordHash) {
        const query = `
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
        const result = await database_js_1.default.query(query, [email, passwordHash]);
        return result.rows[0];
    }
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await database_js_1.default.query(query, [email]);
        return result.rows[0] || null;
    }
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await database_js_1.default.query(query, [id]);
        return result.rows[0] || null;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=user.js.map