"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_js_1 = require("../models/user.js");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, confirmPassword } = req.body;
            if (password !== confirmPassword) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            const existingUser = await user_js_1.UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }
            const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
            const user = await user_js_1.UserModel.create(email, passwordHash);
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({
                message: 'User created successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await user_js_1.UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map