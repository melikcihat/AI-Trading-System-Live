import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { runBacktest, BTInput } from '../domain/backtest/engine';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

router.post('/backtest/run', limiter, (req, res) => {
  try {
    const body = req.body || {};
    const { closes, feesBps = 8, slippageBps = 5, params, initialEquity = 1000 } = body;
    
    // Validation
    if (!Array.isArray(closes) || closes.length === 0) {
      throw new Error('closes array required');
    }
    
    if (!params || typeof params !== 'object') {
      throw new Error('params object required');
    }
    
    const { fast = 9, slow = 21, rsi = 55, stopDistPct, rr } = params;
    
    if (fast >= slow) throw new Error('fast must be < slow');
    if (closes.length < slow + 2) throw new Error('not enough bars');
    if (fast < 5 || fast > 50) throw new Error('fast out of range');
    if (slow < 10 || slow > 200) throw new Error('slow out of range');
    if (rsi < 40 || rsi > 60) throw new Error('rsi threshold out of range');
    
    closes.forEach((x: number) => {
      if (!Number.isFinite(x)) throw new Error('non-finite close');
    });
    
    const input: BTInput = {
      closes,
      feesBps,
      slippageBps,
      params: { fast, slow, rsi, stopDistPct, rr },
      initialEquity
    };
    
    const result = runBacktest(input);
    
    // TODO: Audit log insert
    // await auditLog('backtest_run', { userId, summary: `${result.trades.length} trades, PnL: ${result.pnl}` });
    
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Bad Request' });
  }
});

export default router;
