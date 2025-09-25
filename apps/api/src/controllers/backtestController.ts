import { Request, Response } from 'express';
import { runBacktest } from '../domain/backtest/engine';
import { getStrategyProfile } from '../models/strategyProfile';
import { getStrategy } from '../domain/strategy/registry';
import { aggregate } from '../domain/strategy/aggregate';
import { createAuditLog } from '../models/auditLog';

export async function runBacktestSingle(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { closes, params, feesBps, slippageBps, initialEquity } = req.body;
    
    const result = runBacktest({
      closes,
      params,
      feesBps: feesBps || 8,
      slippageBps: slippageBps || 5,
      initialEquity: initialEquity || 1000
    });
    
    await createAuditLog({
      userId,
      action: 'BACKTEST_RUN',
      summary: `Backtest completed: ${result.trades.length} trades, PnL: ${result.pnl.toFixed(2)}`,
      payload: { 
        tradesCount: result.trades.length,
        pnl: result.pnl,
        winRate: result.winRate,
        maxDD: result.maxDD
      }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function runBacktestCompare(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { closes, profileIds, feesBps, slippageBps, initialEquity } = req.body;
    
    if (!Array.isArray(profileIds) || profileIds.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 profile IDs required' });
    }
    
    const results = [];
    
    for (const profileId of profileIds) {
      const profile = await getStrategyProfile(profileId, userId);
      if (!profile) {
        return res.status(404).json({ error: `Profile ${profileId} not found` });
      }
      
      // Run backtest for each strategy in the profile
      const strategyResults = [];
      
      for (const strategyConfig of profile.strategies) {
        try {
          const strategy = getStrategy(strategyConfig.key);
          const result = runBacktest({
            closes,
            params: strategyConfig.params,
            feesBps: feesBps || 8,
            slippageBps: slippageBps || 5,
            initialEquity: initialEquity || 1000
          });
          
          strategyResults.push({
            strategy: strategyConfig.key,
            result
          });
        } catch (error) {
          console.error(`Error in strategy ${strategyConfig.key}:`, error);
          strategyResults.push({
            strategy: strategyConfig.key,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Calculate aggregate result (simplified - just average the metrics)
      const validResults = strategyResults.filter(r => !r.error);
      if (validResults.length > 0) {
        const avgPnl = validResults.reduce((sum, r) => sum + (r.result?.pnl || 0), 0) / validResults.length;
        const avgWinRate = validResults.reduce((sum, r) => sum + (r.result?.winRate || 0), 0) / validResults.length;
        const avgMaxDD = validResults.reduce((sum, r) => sum + (r.result?.maxDD || 0), 0) / validResults.length;
        const totalTrades = validResults.reduce((sum, r) => sum + (r.result?.trades?.length || 0), 0);
        
        results.push({
          profileId,
          profileName: profile.name,
          aggregateRule: profile.aggregate_rule,
          result: {
            pnl: avgPnl,
            winRate: avgWinRate,
            maxDD: avgMaxDD,
            tradesCount: totalTrades
          },
          strategyResults
        });
      } else {
        results.push({
          profileId,
          profileName: profile.name,
          error: 'All strategies failed'
        });
      }
    }
    
    await createAuditLog({
      userId,
      action: 'BACKTEST_COMPARE',
      summary: `Backtest comparison: ${profileIds.join(' vs ')}`,
      payload: { 
        profileIds,
        results: results.map(r => ({
          profileId: r.profileId,
          pnl: r.result?.pnl,
          winRate: r.result?.winRate,
          maxDD: r.result?.maxDD
        }))
      }
    });
    
    res.json({ results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
