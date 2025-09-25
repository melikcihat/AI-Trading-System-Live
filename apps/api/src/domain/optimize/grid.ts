import { runBacktest } from '../backtest/engine';
import { getStrategy } from '../strategy/registry';

export type GridRanges = Record<string, number[]>;

export interface GridSearchInput {
  closes: number[];
  target: 'pnl' | 'sharpe' | 'sortino' | 'custom';
  strategy: {
    key: string;
    ranges: GridRanges;
  };
  feesBps?: number;
  slippageBps?: number;
  initialEquity?: number;
  maxCombos?: number;
  topN?: number;
}

export interface GridSearchResult {
  params: Record<string, number>;
  metrics: {
    pnl: number;
    winRate: number;
    maxDD: number;
    sortino?: number;
  };
  score: number;
}

export function* cartesian(ranges: GridRanges): Generator<Record<string, number>> {
  const keys = Object.keys(ranges);
  
  function* recursive(idx: number, acc: Record<string, number>): Generator<Record<string, number>> {
    if (idx === keys.length) {
      yield { ...acc };
      return;
    }
    
    const key = keys[idx];
    for (const value of ranges[key]) {
      acc[key] = value;
      yield* recursive(idx + 1, acc);
    }
  }
  
  yield* recursive(0, {});
}

export function scoreDefault(metrics: { pnl: number; maxDD: number; sortino?: number }, target: string = 'custom'): number {
  if (target === 'pnl') return metrics.pnl;
  if (target === 'sharpe' || target === 'sortino') return metrics.sortino ?? 0;
  
  // Custom: PnL with DD penalty
  return metrics.pnl * (1 - Math.max(0, metrics.maxDD - 0.2));
}

export function calculateSortino(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < riskFreeRate);
  
  if (downsideReturns.length === 0) return avgReturn > riskFreeRate ? Infinity : 0;
  
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downsideReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  return downsideDeviation === 0 ? 0 : (avgReturn - riskFreeRate) / downsideDeviation;
}

export function runGridSearch(input: GridSearchInput): GridSearchResult[] {
  const {
    closes,
    target,
    strategy,
    feesBps = 8,
    slippageBps = 5,
    initialEquity = 1000,
    maxCombos = 2000,
    topN = 20
  } = input;

  const results: GridSearchResult[] = [];
  let comboCount = 0;
  
  // Validate strategy exists
  try {
    getStrategy(strategy.key);
  } catch (error) {
    throw new Error(`Strategy not found: ${strategy.key}`);
  }

  // Generate parameter combinations
  for (const params of cartesian(strategy.ranges)) {
    if (comboCount >= maxCombos) break;
    
    try {
      // Run backtest with these parameters
      const backtestResult = runBacktest({
        closes,
        params: params as any,
        feesBps,
        slippageBps,
        initialEquity
      });

      // Calculate returns for Sortino ratio
      const returns: number[] = [];
      let prevEquity = initialEquity;
      for (const equity of backtestResult.equityCurve) {
        if (prevEquity > 0) {
          returns.push((equity - prevEquity) / prevEquity);
        }
        prevEquity = equity;
      }

      const sortino = calculateSortino(returns);
      
      const metrics = {
        pnl: backtestResult.pnl,
        winRate: backtestResult.winRate,
        maxDD: backtestResult.maxDD,
        sortino
      };

      const score = scoreDefault(metrics, target);

      results.push({
        params,
        metrics,
        score
      });

      comboCount++;
    } catch (error) {
      // Skip invalid parameter combinations
      console.warn(`Skipping invalid params:`, params, error);
    }
  }

  // Sort by score (descending) and return top N
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
