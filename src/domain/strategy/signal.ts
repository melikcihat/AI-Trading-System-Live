import { ema, rsi } from './indicators';

export type Side = 'LONG' | 'SHORT' | null;

export interface SignalParams {
  fast: number;
  slow: number;
  rsi: number; // threshold
}

export function validateInput(closes: number[], p: SignalParams) {
  if (!Array.isArray(closes) || closes.length === 0) throw new Error('closes required');
  if (!(p.fast < p.slow)) throw new Error('fast must be < slow');
  if (closes.length < p.slow + 2) throw new Error('not enough bars');
  if (p.fast < 5 || p.fast > 50) throw new Error('fast out of range');
  if (p.slow < 10 || p.slow > 200) throw new Error('slow out of range');
  if (p.rsi < 40 || p.rsi > 60) throw new Error('rsi threshold out of range');
  closes.forEach(x => { if (!Number.isFinite(x)) throw new Error('non-finite close'); });
}

export function generateSignal(closes: number[], params: SignalParams) {
  validateInput(closes, params);
  const eFast = ema(closes, params.fast);
  const eSlow = ema(closes, params.slow);
  const r = rsi(closes, 14);

  const crossUp = eFast.at(-2)! < eSlow.at(-2)! && eFast.at(-1)! > eSlow.at(-1)! && r.at(-1)! >= params.rsi;
  const crossDn = eFast.at(-2)! > eSlow.at(-2)! && eFast.at(-1)! < eSlow.at(-1)! && r.at(-1)! <= 100 - params.rsi;

  const side: Side = crossUp ? 'LONG' : crossDn ? 'SHORT' : null;
  const meta = {
    fast: params.fast, slow: params.slow, rsi: params.rsi,
    lastRsi: r.at(-1),
    fastEma: eFast.at(-1),
    slowEma: eSlow.at(-1)
  };
  return { side, meta };
}
