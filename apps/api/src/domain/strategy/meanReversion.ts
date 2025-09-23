import { Strategy, Signal } from './types';

export const meanReversion: Strategy = {
  name: 'BOLL_MR',
  defaults: { ma: 20, sd: 2, zEntry: 2, zExit: 0.5 },
  
  validate(params: any): void {
    if (params.ma < 5 || params.ma > 200) {
      throw new Error('ma must be between 5 and 200');
    }
    if (params.sd < 0.5 || params.sd > 5) {
      throw new Error('sd must be between 0.5 and 5');
    }
    if (params.zEntry < 1 || params.zEntry > 5) {
      throw new Error('zEntry must be between 1 and 5');
    }
    if (params.zExit < 0.1 || params.zExit > 2) {
      throw new Error('zExit must be between 0.1 and 2');
    }
  },
  
  signal(closes: number[], params: any): Signal {
    const ma = Math.floor(params.ma);
    const sd = params.sd;
    const zEntry = params.zEntry;
    const zExit = params.zExit;
    
    if (closes.length < ma + 2) {
      return { side: null };
    }
    
    // Calculate moving average and standard deviation
    const recentCloses = closes.slice(-ma);
    const mean = recentCloses.reduce((sum, close) => sum + close, 0) / recentCloses.length;
    
    const variance = recentCloses.reduce((sum, close) => sum + Math.pow(close - mean, 2), 0) / recentCloses.length;
    const stdDev = Math.sqrt(variance) || 1e-9;
    
    const currentClose = closes[closes.length - 1];
    const zScore = (currentClose - mean) / stdDev;
    
    // Bollinger Bands
    const upperBand = mean + (sd * stdDev);
    const lowerBand = mean - (sd * stdDev);
    
    // Mean reversion signals
    if (zScore <= -zEntry) {
      return { 
        side: 'LONG', 
        meta: { 
          zScore, 
          mean, 
          stdDev, 
          upperBand, 
          lowerBand,
          currentClose,
          signalType: 'oversold'
        } 
      };
    }
    
    if (zScore >= zEntry) {
      return { 
        side: 'SHORT', 
        meta: { 
          zScore, 
          mean, 
          stdDev, 
          upperBand, 
          lowerBand,
          currentClose,
          signalType: 'overbought'
        } 
      };
    }
    
    return { 
      side: null, 
      meta: { 
        zScore, 
        mean, 
        stdDev, 
        upperBand, 
        lowerBand,
        currentClose
      } 
    };
  }
};
