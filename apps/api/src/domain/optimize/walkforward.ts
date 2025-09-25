import { runGridSearch, GridSearchInput } from './grid';
import { runBacktest } from '../backtest/engine';
import { getStrategyProfile } from '../../models/strategyProfile';

export interface WalkForwardInput {
  closes: number[];
  profileId?: number;
  strategy?: {
    key: string;
    ranges: Record<string, number[]>;
  };
  trainBars: number;
  testBars: number;
  mode: 'rolling' | 'anchored';
  feesBps?: number;
  slippageBps?: number;
  initialEquity?: number;
}

export interface WalkForwardWindow {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
  bestParams: Record<string, number>;
  trainMetrics: {
    pnl: number;
    winRate: number;
    maxDD: number;
    sortino?: number;
  };
  testMetrics: {
    pnl: number;
    winRate: number;
    maxDD: number;
    sortino?: number;
  };
}

export interface WalkForwardResult {
  windows: WalkForwardWindow[];
  aggregate: {
    totalPnL: number;
    avgWinRate: number;
    maxDD: number;
    avgSortino: number;
    totalTrades: number;
  };
  chosenParamsPerWindow: Record<string, number>[];
}

export function makeWindows(
  nBars: number, 
  train: number, 
  test: number, 
  mode: 'rolling' | 'anchored'
): { train: [number, number]; test: [number, number] }[] {
  const windows: { train: [number, number]; test: [number, number] }[] = [];
  let start = 0;
  
  while (start + train + test <= nBars) {
    const trainStart = mode === 'anchored' ? 0 : start;
    const trainEnd = trainStart + train;
    const testStart = trainEnd;
    const testEnd = testStart + test;
    
    windows.push({
      train: [trainStart, trainEnd],
      test: [testStart, testEnd]
    });
    
    start += test; // Slide by test window size
  }
  
  return windows;
}

export async function runWalkForward(input: WalkForwardInput): Promise<WalkForwardResult> {
  const {
    closes,
    profileId,
    strategy,
    trainBars,
    testBars,
    mode,
    feesBps = 8,
    slippageBps = 5,
    initialEquity = 1000
  } = input;

  // Get strategy configuration
  let strategyConfig: { key: string; ranges: Record<string, number[]> };
  
  if (profileId) {
    // Use profile strategies
    const profile = await getStrategyProfile(profileId, 1); // TODO: get userId from auth
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }
    
    // For now, use the first strategy from the profile
    const firstStrategy = profile.strategies[0];
    if (!firstStrategy) {
      throw new Error('Profile has no strategies');
    }
    
    // Create ranges based on strategy defaults (simplified)
    strategyConfig = {
      key: firstStrategy.key,
      ranges: {
        // Create small ranges around default values
        ...Object.fromEntries(
          Object.entries(firstStrategy.params).map(([key, value]) => [
            key, 
            [(value as number) * 0.8, value as number, (value as number) * 1.2] // ±20% range
          ])
        )
      } as Record<string, number[]>
    };
  } else if (strategy) {
    strategyConfig = strategy;
  } else {
    throw new Error('Either profileId or strategy must be provided');
  }

  const windows = makeWindows(closes.length, trainBars, testBars, mode);
  const walkForwardWindows: WalkForwardWindow[] = [];
  const chosenParamsPerWindow: Record<string, number>[] = [];

  for (const window of windows) {
    const [trainStart, trainEnd] = window.train;
    const [testStart, testEnd] = window.test;
    
    // Extract training data
    const trainCloses = closes.slice(trainStart, trainEnd);
    
    // Run grid search on training data
    const gridSearchInput: GridSearchInput = {
      closes: trainCloses,
      target: 'custom',
      strategy: strategyConfig,
      feesBps,
      slippageBps,
      initialEquity,
      maxCombos: 100, // Limit for walk-forward
      topN: 1
    };
    
    const gridResults = runGridSearch(gridSearchInput);
    
    if (gridResults.length === 0) {
      console.warn(`No valid parameters found for window ${trainStart}-${trainEnd}`);
      continue;
    }
    
    const bestParams = gridResults[0].params;
    const trainMetrics = gridResults[0].metrics;
    
    // Test on out-of-sample data
    const testCloses = closes.slice(testStart, testEnd);
    
    try {
      const testResult = runBacktest({
        closes: testCloses,
        params: bestParams as any,
        feesBps,
        slippageBps,
        initialEquity
      });

      // Calculate Sortino for test data
      const returns: number[] = [];
      let prevEquity = initialEquity;
      for (const equity of testResult.equityCurve) {
        if (prevEquity > 0) {
          returns.push((equity - prevEquity) / prevEquity);
        }
        prevEquity = equity;
      }

      const sortino = returns.length > 0 ? 
        returns.reduce((sum, r) => sum + r, 0) / returns.length / 
        Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r, 0), 0) / returns.length) : 0;

      const testMetrics = {
        pnl: testResult.pnl,
        winRate: testResult.winRate,
        maxDD: testResult.maxDD,
        sortino
      };

      walkForwardWindows.push({
        trainStart,
        trainEnd,
        testStart,
        testEnd,
        bestParams,
        trainMetrics,
        testMetrics
      });

      chosenParamsPerWindow.push(bestParams);
    } catch (error) {
      console.warn(`Test failed for window ${testStart}-${testEnd}:`, error);
    }
  }

  // Calculate aggregate metrics
  const totalPnL = walkForwardWindows.reduce((sum, w) => sum + w.testMetrics.pnl, 0);
  const avgWinRate = walkForwardWindows.reduce((sum, w) => sum + w.testMetrics.winRate, 0) / walkForwardWindows.length;
  const maxDD = Math.max(...walkForwardWindows.map(w => w.testMetrics.maxDD));
  const avgSortino = walkForwardWindows.reduce((sum, w) => sum + (w.testMetrics.sortino || 0), 0) / walkForwardWindows.length;
  const totalTrades = walkForwardWindows.length; // Simplified

  return {
    windows: walkForwardWindows,
    aggregate: {
      totalPnL,
      avgWinRate,
      maxDD,
      avgSortino,
      totalTrades
    },
    chosenParamsPerWindow
  };
}
