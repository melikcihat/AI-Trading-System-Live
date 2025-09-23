import { Router } from 'express';
import { getStrategyParams, saveStrategyParams, validateStrategyParams } from '../models/strategyParams';
import { createAuditLog } from '../models/auditLog';

const router = Router();

// Get current strategy parameters
router.get('/strategy/params', async (req, res) => {
  try {
    // For now, use user ID 1 (in real app, get from auth)
    const userId = 1;
    const params = await getStrategyParams(userId);
    
    if (!params) {
      // Return default params if none exist
      return res.json({
        fast: 9,
        slow: 21,
        rsi: 55,
        stopDistPct: 0.005,
        rr: 2.0
      });
    }
    
    res.json({
      fast: params.fast,
      slow: params.slow,
      rsi: params.rsi,
      stopDistPct: params.stopDistPct,
      rr: params.rr
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

// Save strategy parameters
router.post('/strategy/params', async (req, res) => {
  try {
    const { fast, slow, rsi, stopDistPct, rr } = req.body;
    
    // Validate parameters
    const errors = validateStrategyParams({ fast, slow, rsi, stopDistPct, rr });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // For now, use user ID 1 (in real app, get from auth)
    const userId = 1;
    
    const params = await saveStrategyParams({
      userId,
      fast,
      slow,
      rsi,
      stopDistPct,
      rr
    });
    
    // Log to audit
    await createAuditLog({
      userId,
      action: 'STRATEGY_PARAMS_UPDATE',
      summary: `Strategy parameters updated: fast=${fast}, slow=${slow}, rsi=${rsi}`,
      payload: { fast, slow, rsi, stopDistPct, rr }
    });
    
    res.json({
      fast: params.fast,
      slow: params.slow,
      rsi: params.rsi,
      stopDistPct: params.stopDistPct,
      rr: params.rr
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

export default router;
