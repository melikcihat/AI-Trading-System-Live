import { createAuditLog } from '../models/auditLog';
import { notifyAll } from '../domain/alerts/notifier';

export interface SafetyCheckParams {
  equity: number;
  proposedNotional: number;
  todayLossPct: number;
  userId?: number;
}

export function ensureTradingAllowed(params: SafetyCheckParams): void {
  const { equity, proposedNotional, todayLossPct, userId } = params;
  
  // Safety lock check
  if (process.env.SAFETY_LOCK === 'true') {
    throw new Error('trading disabled');
  }
  
  // Daily loss limit check
  const dailyLossLimit = Number(process.env.DAILY_LOSS_LIMIT_PCT || 0.03);
  if (todayLossPct <= -Math.abs(dailyLossLimit)) {
    throw new Error('daily loss limit exceeded');
  }
  
  // Max notional check
  const maxNotionalPct = Number(process.env.MAX_ORDER_NOTIONAL_PCT || 0.3);
  if (proposedNotional > equity * maxNotionalPct) {
    throw new Error('max notional exceeded');
  }
}

export async function logSafetyViolation(
  reason: string, 
  params: SafetyCheckParams,
  additionalData?: any
): Promise<void> {
  const { userId } = params;
  
  // Log to audit
  await createAuditLog({
    userId,
    action: 'SAFETY_VIOLATION',
    summary: `Safety check failed: ${reason}`,
    payload: {
      reason,
      equity: params.equity,
      proposedNotional: params.proposedNotional,
      todayLossPct: params.todayLossPct,
      ...additionalData
    }
  });
  
  // Send alert
  await notifyAll({
    type: 'SAFETY_VIOLATION',
    payload: {
      reason,
      equity: params.equity,
      proposedNotional: params.proposedNotional,
      todayLossPct: params.todayLossPct,
      ...additionalData
    },
    userId
  });
}

// Idempotency tracking
const processedKeys = new Set<string>();
const keyExpiry = new Map<string, number>();

export function checkIdempotency(key: string): boolean {
  const now = Date.now();
  const expiry = keyExpiry.get(key) || 0;
  
  // Clean expired keys
  if (now > expiry) {
    processedKeys.delete(key);
    keyExpiry.delete(key);
  }
  
  return processedKeys.has(key);
}

export function markIdempotency(key: string, ttlMs: number = 60000): void {
  const now = Date.now();
  processedKeys.add(key);
  keyExpiry.set(key, now + ttlMs);
}

// Concurrency lock per symbol
const symbolLocks = new Map<string, boolean>();

export function acquireSymbolLock(symbol: string): boolean {
  if (symbolLocks.get(symbol)) {
    return false; // Already locked
  }
  symbolLocks.set(symbol, true);
  return true;
}

export function releaseSymbolLock(symbol: string): void {
  symbolLocks.delete(symbol);
}
