import { Strategy } from './types';
import { emaRsi } from './signal';
import { breakout } from './breakout';
import { meanReversion } from './meanReversion';

// Strategy registry
export const strategies: Record<string, Strategy> = {
  'EMA_RSI': emaRsi,
  'DONCHIAN_BREAKOUT': breakout,
  'BOLL_MR': meanReversion
};

export function getStrategy(key: string): Strategy {
  const strategy = strategies[key];
  if (!strategy) {
    throw new Error(`Strategy not found: ${key}`);
  }
  return strategy;
}

export function getAllStrategies(): Record<string, Strategy> {
  return strategies;
}

export function validateStrategyParams(key: string, params: any): void {
  const strategy = getStrategy(key);
  strategy.validate(params);
}
