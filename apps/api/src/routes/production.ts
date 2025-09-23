import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { 
  getProductionStatus, 
  validateOrderWithFilters, 
  runPreFlightChecks 
} from '../controllers/productionController';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

// Production status and validation routes
router.get('/production/status', limiter, getProductionStatus);
router.post('/production/validate-order', limiter, idempotencyMiddleware(), validateOrderWithFilters);
router.get('/production/pre-flight', limiter, runPreFlightChecks);

export default router;
