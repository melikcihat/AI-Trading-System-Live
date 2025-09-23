import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { runGridSearchOptimization, runWalkForwardOptimization } from '../controllers/optimizeController';

const router = Router();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10 // Limit optimization requests
});

router.post('/optimize/grid', limiter, runGridSearchOptimization);
router.post('/optimize/walkforward', limiter, runWalkForwardOptimization);

export default router;
