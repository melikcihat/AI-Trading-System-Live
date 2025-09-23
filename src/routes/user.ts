import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { ApiKeyController } from '../controllers/apiKeyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// User profile routes
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);

// API key management routes
router.get('/api-keys', authenticateToken, ApiKeyController.getApiKeys);
router.post('/api-keys', authenticateToken, ApiKeyController.addApiKey);
router.delete('/api-keys/:id', authenticateToken, ApiKeyController.deleteApiKey);

export default router;
