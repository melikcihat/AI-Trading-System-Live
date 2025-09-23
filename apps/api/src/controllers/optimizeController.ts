import { Request, Response } from 'express';
import { runGridSearch, GridSearchInput } from '../domain/optimize/grid';
import { runWalkForward, WalkForwardInput } from '../domain/optimize/walkforward';
import { createAuditLog } from '../models/auditLog';

export async function runGridSearchOptimization(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const {
      closes,
      target,
      strategy,
      feesBps,
      slippageBps,
      initialEquity,
      maxCombos,
      topN
    } = req.body;

    const input: GridSearchInput = {
      closes,
      target: target || 'custom',
      strategy,
      feesBps: feesBps || 8,
      slippageBps: slippageBps || 5,
      initialEquity: initialEquity || 1000,
      maxCombos: maxCombos || 2000,
      topN: topN || 20
    };

    const results = runGridSearch(input);

    await createAuditLog({
      userId,
      action: 'GRID_SEARCH_RUN',
      summary: `Grid search completed: ${results.length} results for ${strategy.key}`,
      payload: { 
        strategy: strategy.key,
        target,
        maxCombos,
        topN,
        resultsCount: results.length
      }
    });

    res.json({ results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function runWalkForwardOptimization(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const {
      closes,
      profileId,
      strategy,
      trainBars,
      testBars,
      mode,
      feesBps,
      slippageBps,
      initialEquity
    } = req.body;

    const input: WalkForwardInput = {
      closes,
      profileId,
      strategy,
      trainBars,
      testBars,
      mode: mode || 'rolling',
      feesBps: feesBps || 8,
      slippageBps: slippageBps || 5,
      initialEquity: initialEquity || 1000
    };

    const result = await runWalkForward(input);

    await createAuditLog({
      userId,
      action: 'WALK_FORWARD_RUN',
      summary: `Walk-forward completed: ${result.windows.length} windows`,
      payload: { 
        profileId,
        trainBars,
        testBars,
        mode,
        windowsCount: result.windows.length,
        totalPnL: result.aggregate.totalPnL
      }
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
