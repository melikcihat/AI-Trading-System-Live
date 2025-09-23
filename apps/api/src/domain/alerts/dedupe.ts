// Simple in-memory deduplication for alerts
// In production, this should use Redis or similar

interface AlertRecord {
  key: string;
  timestamp: number;
  side: string;
}

const alertHistory = new Map<string, AlertRecord>();
const DEDUP_WINDOW_MS = Number(process.env.ALERTS_DEDUP_WINDOW_SECS || 60) * 1000;

export function shouldSendAlert(symbol: string, timeframe: string, side: string): boolean {
  const key = `${symbol}_${timeframe}`;
  const now = Date.now();
  
  const existing = alertHistory.get(key);
  
  if (!existing) {
    alertHistory.set(key, { key, timestamp: now, side });
    return true;
  }
  
  // Check if within dedup window and same side
  if (now - existing.timestamp < DEDUP_WINDOW_MS && existing.side === side) {
    return false;
  }
  
  // Update record
  alertHistory.set(key, { key, timestamp: now, side });
  return true;
}

export function clearOldAlerts(): void {
  const now = Date.now();
  for (const [key, record] of alertHistory.entries()) {
    if (now - record.timestamp > DEDUP_WINDOW_MS * 2) {
      alertHistory.delete(key);
    }
  }
}

// Clean up old alerts every 5 minutes
setInterval(clearOldAlerts, 5 * 60 * 1000);
