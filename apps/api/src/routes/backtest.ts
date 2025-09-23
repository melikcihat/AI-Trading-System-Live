import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { runBacktestSingle, runBacktestCompare } from '../controllers/backtestController';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

router.post('/backtest/run', limiter, runBacktestSingle);
router.post('/backtest/compare', limiter, runBacktestCompare);

export default router;
