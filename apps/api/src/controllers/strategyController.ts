import { Request, Response } from 'express';
import { getAllStrategies } from '../domain/strategy/registry';
import { aggregate, getStrategyVotes } from '../domain/strategy/aggregate';
import { getActiveStrategyProfile } from '../models/strategyProfile';
import { createAuditLog } from '../models/auditLog';
import { notifySignal } from '../domain/alerts/notifier';

export async function getStrategies(req: Request, res: Response) {
  try {
    const strategies = getAllStrategies();
    const strategyList = Object.keys(strategies).map(key => ({
      key,
      name: strategies[key].name,
      defaults: strategies[key].defaults
    }));
    
    res.json({ strategies: strategyList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function generateMultiSignal(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { closes, symbol, timeframe } = req.body;
    
    // Get active profile
    const profile = await getActiveStrategyProfile(userId);
    if (!profile) {
      return res.status(400).json({ error: 'No active strategy profile found' });
    }
    
    const strategies = profile.strategies;
    const signals = [];
    
    // Generate signals for each strategy
    for (const strategyConfig of strategies) {
      try {
        const strategy = require(`../domain/strategy/registry`).getStrategy(strategyConfig.key);
        const signal = strategy.signal(closes, strategyConfig.params);
        signals.push(signal);
      } catch (error) {
        console.error(`Error in strategy ${strategyConfig.key}:`, error);
        signals.push({ side: null, meta: { error: error instanceof Error ? error.message : String(error) } });
      }
    }
    
    // Aggregate signals
    const finalSignal = aggregate(profile.aggregate_rule as any, signals, profile.priority_order);
    
    // Create strategy votes for display
    const strategyVotes = getStrategyVotes(signals);
    
    // Send notification if there's a signal
    if (finalSignal.side) {
      await notifySignal(
        symbol || 'BTCUSDT',
        timeframe || '1m',
        finalSignal.side,
        strategyVotes
      );
    }
    
    await createAuditLog({
      userId,
      action: 'MULTI_SIGNAL_GENERATED',
      summary: `Multi-signal: ${finalSignal.side} using ${profile.name}`,
      payload: { 
        profileId: profile.id,
        finalSignal: finalSignal.side,
        strategyVotes,
        symbol,
        timeframe
      }
    });
    
    res.json({
      signal: { side: finalSignal.side },
      meta: finalSignal.meta,
      strategyVotes,
      profile: {
        id: profile.id,
        name: profile.name,
        aggregateRule: profile.aggregate_rule
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
