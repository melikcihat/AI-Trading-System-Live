import { Router, Request, Response } from 'express';
import { positionSizeBase, levels, notional, validateRiskRules, RiskRules } from '../domain/risk/risk';

const router = Router();

function getRules(): RiskRules {
  return {
    MAX_POSITIONS: Number(process.env.MAX_POSITIONS || 1),
    MAX_RISK_PER_TRADE_PCT: Number(process.env.MAX_RISK_PER_TRADE_PCT || 0.01),
    DAILY_LOSS_LIMIT_PCT: Number(process.env.DAILY_LOSS_LIMIT_PCT || 0.03),
    MIN_STOP_DIST_PCT: Number(process.env.MIN_STOP_DIST_PCT || 0.003),
    MAX_NOTIONAL_PCT: Number(process.env.MAX_NOTIONAL_PCT || 0.3)
  };
}

router.get('/risk/rules', (_req: Request, res: Response) => res.json(getRules()));

router.post('/risk/preview', (req: Request, res: Response) => {
  try {
    const { side, entryPrice, equity, riskPct, stopDistPct, rr = 2 } = req.body || {};
    if (!['LONG','SHORT'].includes(side)) throw new Error('side required');
    if (!(entryPrice > 0 && equity > 0)) throw new Error('entryPrice/equity must be > 0');
    const rules = getRules();
    if (!(stopDistPct >= rules.MIN_STOP_DIST_PCT && stopDistPct <= 0.05)) throw new Error('invalid stopDistPct');
    if (!(riskPct > 0 && riskPct <= 0.05)) throw new Error('invalid riskPct');

    const qty = positionSizeBase(entryPrice, equity, riskPct, stopDistPct);
    const notion = notional(entryPrice, qty);
    const { stopLoss, takeProfit } = levels(side, entryPrice, stopDistPct, rr);
    return res.json({
      positionSizeBase: qty,
      positionNotional: notion,
      stopLoss, takeProfit,
      riskAmount: equity * riskPct,
      rrUsed: rr
    });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Bad Request' });
  }
});

router.post('/risk/validate', (req: Request, res: Response) => {
  try {
    const { proposed, context } = req.body || {};
    const result = validateRiskRules(proposed, getRules(), context || { openPositionsCount:0, todayRealizedLossPct:0 });
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Bad Request' });
  }
});

export default router;
