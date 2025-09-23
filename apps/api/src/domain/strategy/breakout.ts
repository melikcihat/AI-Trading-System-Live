import { Strategy, Signal } from './types';

export const breakout: Strategy = {
  name: 'DONCHIAN_BREAKOUT',
  defaults: { period: 20, confirmBars: 1 },
  
  validate(params: any): void {
    if (params.period < 5 || params.period > 200) {
      throw new Error('period must be between 5 and 200');
    }
    if (params.confirmBars < 0 || params.confirmBars > 5) {
      throw new Error('confirmBars must be between 0 and 5');
    }
  },
  
  signal(closes: number[], params: any): Signal {
    const period = Math.floor(params.period);
    const confirmBars = Math.floor(params.confirmBars);
    
    if (closes.length < period + confirmBars + 1) {
      return { side: null };
    }
    
    // Calculate Donchian levels
    const lookback = closes.slice(-period - 1, -1);
    const highest = Math.max(...lookback);
    const lowest = Math.min(...lookback);
    
    const currentClose = closes[closes.length - 1];
    const confirmationBars = closes.slice(-(confirmBars + 1), -1);
    
    // Check for breakout with confirmation
    const brokeUp = currentClose > highest && 
                   confirmationBars.every(c => c <= highest);
    const brokeDown = currentClose < lowest && 
                      confirmationBars.every(c => c >= lowest);
    
    if (brokeUp) {
      return { 
        side: 'LONG', 
        meta: { 
          highest, 
          lowest, 
          currentClose,
          breakoutType: 'up'
        } 
      };
    }
    
    if (brokeDown) {
      return { 
        side: 'SHORT', 
        meta: { 
          highest, 
          lowest, 
          currentClose,
          breakoutType: 'down'
        } 
      };
    }
    
    return { 
      side: null, 
      meta: { 
        highest, 
        lowest, 
        currentClose 
      } 
    };
  }
};
