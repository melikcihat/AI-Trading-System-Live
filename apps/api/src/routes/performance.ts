import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  getPerformanceSummary, 
  getEquityCurve, 
  getMonthlyHeatmap,
  getTradeJournal,
  createTradeJournalEntry,
  updateTradeJournalEntry
} from '../controllers/performanceController';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

// Performance routes
router.get('/performance/summary', limiter, getPerformanceSummary);
router.get('/performance/curve', limiter, getEquityCurve);
router.get('/performance/heatmap', limiter, getMonthlyHeatmap);

// Trade journal routes
router.get('/journal', limiter, getTradeJournal);
router.post('/journal', limiter, createTradeJournalEntry);
router.put('/journal/:id', limiter, updateTradeJournalEntry);

export default router;
