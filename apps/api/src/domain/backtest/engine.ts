import { ema, rsi } from '../strategy/indicators';

export type Side = 'LONG' | 'SHORT';

export interface StratParams { 
  fast: number; 
  slow: number; 
  rsi: number; 
  stopDistPct?: number; 
  rr?: number; 
}

export interface BTInput {
  closes: number[]; 
  feesBps?: number; 
  slippageBps?: number;
  params: StratParams; 
  initialEquity?: number;
}

export interface Trade { 
  side: Side; 
  entryIdx: number; 
  exitIdx: number; 
  entry: number; 
  exit: number; 
  pnl: number; 
  reason: 'reverse' | 'sl' | 'tp'; 
}

export interface BTResult { 
  trades: Trade[]; 
  equityCurve: number[]; 
  pnl: number; 
  winRate: number; 
  maxDD: number; 
}

export function runBacktest(input: BTInput): BTResult {
  const { closes, feesBps = 8, slippageBps = 5, params, initialEquity = 1000 } = input;
  
  // Generate signals
  const eFast = ema(closes, params.fast);
  const eSlow = ema(closes, params.slow);
  const r = rsi(closes, 14);
  
  const signals: (Side | null)[] = [];
  for (let i = 1; i < closes.length; i++) {
    const crossUp = eFast[i-1]! < eSlow[i-1]! && eFast[i]! > eSlow[i]! && r[i]! >= params.rsi;
    const crossDn = eFast[i-1]! > eSlow[i-1]! && eFast[i]! < eSlow[i]! && r[i]! <= 100 - params.rsi;
    signals.push(crossUp ? 'LONG' : crossDn ? 'SHORT' : null);
  }
  
  const trades: Trade[] = [];
  let currentSide: Side | null = null;
  let entryIdx = -1;
  let entryPrice = 0;
  let equity = initialEquity;
  const equityCurve: number[] = [equity];
  
  for (let i = 1; i < closes.length; i++) {
    const signal = signals[i-1];
    const currentPrice = closes[i]!;
    
    // Check for exit conditions
    if (currentSide && entryIdx >= 0) {
      let shouldExit = false;
      let exitReason: 'reverse' | 'sl' | 'tp' = 'reverse';
      
      // Reverse signal
      if (signal && signal !== currentSide) {
        shouldExit = true;
        exitReason = 'reverse';
      }
      
      // Stop Loss / Take Profit
      if (params.stopDistPct && params.rr) {
        const stopLoss = currentSide === 'LONG' 
          ? entryPrice * (1 - params.stopDistPct)
          : entryPrice * (1 + params.stopDistPct);
        const takeProfit = currentSide === 'LONG'
          ? entryPrice * (1 + params.stopDistPct * params.rr)
          : entryPrice * (1 - params.stopDistPct * params.rr);
        
        if (currentSide === 'LONG' && currentPrice <= stopLoss) {
          shouldExit = true;
          exitReason = 'sl';
        } else if (currentSide === 'LONG' && currentPrice >= takeProfit) {
          shouldExit = true;
          exitReason = 'tp';
        } else if (currentSide === 'SHORT' && currentPrice >= stopLoss) {
          shouldExit = true;
          exitReason = 'sl';
        } else if (currentSide === 'SHORT' && currentPrice <= takeProfit) {
          shouldExit = true;
          exitReason = 'tp';
        }
      }
      
      if (shouldExit) {
        const exitPrice = currentPrice * (1 + (currentSide === 'LONG' ? 1 : -1) * slippageBps / 10000);
        const pnl = currentSide === 'LONG' 
          ? (exitPrice - entryPrice) / entryPrice
          : (entryPrice - exitPrice) / entryPrice;
        const fees = (entryPrice + exitPrice) * feesBps / 10000;
        const netPnl = pnl - fees;
        
        trades.push({
          side: currentSide,
          entryIdx,
          exitIdx: i,
          entry: entryPrice,
          exit: exitPrice,
          pnl: netPnl,
          reason: exitReason
        });
        
        equity *= (1 + netPnl);
        currentSide = null;
        entryIdx = -1;
      }
    }
    
    // Check for entry
    if (!currentSide && signal) {
      currentSide = signal;
      entryIdx = i;
      entryPrice = currentPrice * (1 + (signal === 'LONG' ? 1 : -1) * slippageBps / 10000);
    }
    
    equityCurve.push(equity);
  }
  
  // Calculate metrics
  const totalPnl = equity - initialEquity;
  const winRate = trades.length > 0 ? trades.filter(t => t.pnl > 0).length / trades.length : 0;
  
  // Max drawdown
  let maxDD = 0;
  let peak = initialEquity;
  for (const eq of equityCurve) {
    if (eq > peak) peak = eq;
    const dd = (eq - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  
  return {
    trades,
    equityCurve,
    pnl: totalPnl,
    winRate,
    maxDD
  };
}
