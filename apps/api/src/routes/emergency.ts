import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  getEmergencyStatus, 
  panicStop, 
  partialStop, 
  updateSafetyControls,
  validateTradingConditions
} from '../controllers/emergencyController';

const router = Router();

// Emergency routes have stricter rate limits
const emergencyLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 5 // Very low limit for emergency actions
});

const statusLimiter = rateLimit({
  windowMs: 60_000,
  max: 60 // Higher limit for status checks
});

// Emergency control routes
router.get('/emergency/status', statusLimiter, getEmergencyStatus);
router.post('/emergency/panic-stop', emergencyLimiter, panicStop);
router.post('/emergency/partial-stop', emergencyLimiter, partialStop);
router.put('/emergency/controls', emergencyLimiter, updateSafetyControls);
router.post('/emergency/validate', statusLimiter, validateTradingConditions);

export default router;
