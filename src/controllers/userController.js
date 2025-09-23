"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_js_1 = require("../models/user.js");
class UserController {
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const user = await user_js_1.UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                }
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const { email } = req.body;
            // Check if email is already taken by another user
            if (email) {
                const existingUser = await user_js_1.UserModel.findByEmail(email);
                if (existingUser && existingUser.id !== req.user.id) {
                    return res.status(400).json({ error: 'Email already in use' });
                }
            }
            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: req.user.id,
                    email: email || req.user.email
                }
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map