export function ema(values: number[], period: number): number[] {
  if (period <= 0) throw new Error('period>0');
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((x, i) => {
    if (!Number.isFinite(x)) throw new Error('Non-finite close');
    out.push(i === 0 ? x : x * k + (out[i - 1] || 0) * (1 - k));
  });
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  if (values.length < period + 2) {
    return Array(values.length).fill(NaN);
  }
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) deltas.push((values[i] || 0) - (values[i - 1] || 0));
  const ups = deltas.map(d => Math.max(d, 0));
  const dns = deltas.map(d => Math.max(-d, 0));

  const sma = (arr: number[], p: number) =>
    arr.map((_, i) =>
      i + 1 >= p ? arr.slice(i + 1 - p, i + 1).reduce((a, b) => a + b, 0) / p : NaN
    );

  const rollUp = sma(ups, period);
  const rollDn = sma(dns, period);
  const r: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period) { r.push(NaN); continue; }
    const u = rollUp[i - 1] ?? NaN;
    const d = rollDn[i - 1] ?? NaN;
    const rs = u / ((d || 0) + 1e-9);
    r.push(100 - 100 / (1 + rs));
  }
  return r;
}
