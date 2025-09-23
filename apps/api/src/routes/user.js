"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const apiKeyController_js_1 = require("../controllers/apiKeyController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// User profile routes
router.get('/profile', auth_js_1.authenticateToken, userController_js_1.UserController.getProfile);
router.put('/profile', auth_js_1.authenticateToken, userController_js_1.UserController.updateProfile);
// API key management routes
router.get('/api-keys', auth_js_1.authenticateToken, apiKeyController_js_1.ApiKeyController.getApiKeys);
router.post('/api-keys', auth_js_1.authenticateToken, apiKeyController_js_1.ApiKeyController.addApiKey);
router.delete('/api-keys/:id', auth_js_1.authenticateToken, apiKeyController_js_1.ApiKeyController.deleteApiKey);
exports.default = router;
//# sourceMappingURL=user.js.map