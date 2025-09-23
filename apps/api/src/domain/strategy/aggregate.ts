import { Signal, AggregateRule } from './types';

export function aggregate(
  rule: AggregateRule, 
  signals: Signal[], 
  priorityOrder: number[] = [0, 1, 2]
): Signal {
  if (rule === 'PRIORITY') {
    // Return first non-null signal in priority order
    for (const idx of priorityOrder) {
      const signal = signals[idx];
      if (signal?.side) {
        return signal;
      }
    }
    return { side: null };
  }
  
  // MAJORITY rule
  const votes = { LONG: 0, SHORT: 0 };
  let totalVotes = 0;
  
  for (const signal of signals) {
    if (signal.side) {
      votes[signal.side]++;
      totalVotes++;
    }
  }
  
  // Need at least 2 votes for majority
  if (totalVotes < 2) {
    return { side: null };
  }
  
  if (votes.LONG > votes.SHORT) {
    return { 
      side: 'LONG', 
      meta: { 
        votes: votes.LONG, 
        total: totalVotes,
        rule: 'majority'
      } 
    };
  }
  
  if (votes.SHORT > votes.LONG) {
    return { 
      side: 'SHORT', 
      meta: { 
        votes: votes.SHORT, 
        total: totalVotes,
        rule: 'majority'
      } 
    };
  }
  
  return { 
    side: null, 
    meta: { 
      votes: votes, 
      total: totalVotes,
      rule: 'tie'
    } 
  };
}

export function getStrategyVotes(signals: Signal[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  signals.forEach((signal, index) => {
    result[`strategy_${index}`] = {
      side: signal.side,
      meta: signal.meta
    };
  });
  
  return result;
}
