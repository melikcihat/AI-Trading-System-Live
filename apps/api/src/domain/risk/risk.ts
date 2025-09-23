export type Side = 'LONG' | 'SHORT';

export function positionSizeBase(entryPrice: number, equity: number, riskPct: number, stopDistPct: number): number {
  const riskUsd = equity * riskPct;
  const lossPerUnit = entryPrice * stopDistPct;
  return Math.max(0, riskUsd / Math.max(lossPerUnit, 1e-9));
}

export function levels(side: Side, entryPrice: number, stopDistPct: number, rr = 2) {
  if (side === 'LONG') {
    return { stopLoss: entryPrice * (1 - stopDistPct), takeProfit: entryPrice * (1 + stopDistPct * rr) };
  } else {
    return { stopLoss: entryPrice * (1 + stopDistPct), takeProfit: entryPrice * (1 - stopDistPct * rr) };
  }
}

export function notional(entryPrice: number, qtyBase: number) {
  return entryPrice * qtyBase;
}

export interface RiskRules {
  MAX_POSITIONS: number;
  MAX_RISK_PER_TRADE_PCT: number;
  DAILY_LOSS_LIMIT_PCT: number;
  MIN_STOP_DIST_PCT: number;
  MAX_NOTIONAL_PCT: number;
}

export function validateRiskRules(
  proposed: { side: Side; entryPrice: number; equity: number; riskPct: number; stopDistPct: number; rr?: number },
  rules: RiskRules,
  context: { openPositionsCount: number; todayRealizedLossPct: number }
) {
  const reasons: string[] = [];
  if (proposed.stopDistPct < rules.MIN_STOP_DIST_PCT) reasons.push('Stop distance below minimum');
  if (proposed.riskPct > rules.MAX_RISK_PER_TRADE_PCT) reasons.push('Risk per trade exceeds max');
  if (context.openPositionsCount >= rules.MAX_POSITIONS) reasons.push('Max open positions reached');
  if (context.todayRealizedLossPct <= -Math.abs(rules.DAILY_LOSS_LIMIT_PCT)) reasons.push('Daily loss limit exceeded');

  const qty = positionSizeBase(proposed.entryPrice, proposed.equity, proposed.riskPct, proposed.stopDistPct);
  const notion = notional(proposed.entryPrice, qty);
  if (notion > proposed.equity * rules.MAX_NOTIONAL_PCT) reasons.push('Position notional exceeds max percent of equity');

  return { ok: reasons.length === 0, reasons };
}
