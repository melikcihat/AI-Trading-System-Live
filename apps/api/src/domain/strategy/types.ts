export type Side = 'LONG' | 'SHORT' | null;

export interface StratParams { 
  [key: string]: number 
}

export interface Signal { 
  side: Side; 
  meta?: Record<string, any> 
}

export interface Strategy {
  name: string;
  defaults: StratParams;
  validate(params: StratParams): void;
  signal(closes: number[], params: StratParams): Signal;
}

export type AggregateRule = 'PRIORITY' | 'MAJORITY';

export interface StrategyConfig {
  key: string;
  params: StratParams;
}

export interface StrategyProfile {
  id?: number;
  userId: number;
  name: string;
  symbol: string;
  timeframe: string;
  strategies: StrategyConfig[];
  aggregateRule: AggregateRule;
  priorityOrder: number[];
  active: boolean;
  updatedAt?: Date;
}
