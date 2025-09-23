import { getAlertTemplate } from '../../models/alertTemplate';

export interface AlertContext {
  ts: string;
  symbol: string;
  timeframe: string;
  side: string;
  ema_rsi?: string;
  breakout?: string;
  mr?: string;
  rr?: number;
  sl?: number;
  tp?: number;
  [key: string]: any;
}

export function renderTemplate(template: string, context: AlertContext): string {
  let rendered = template;
  
  // Replace all {{variable}} with context values
  Object.keys(context).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = context[key];
    rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  
  return rendered;
}

export async function getRenderedAlert(key: string, channel: 'TELEGRAM' | 'DISCORD', context: AlertContext): Promise<string | null> {
  const template = await getAlertTemplate(key, channel);
  if (!template) return null;
  
  return renderTemplate(template.templateText, context);
}

export function createSignalContext(
  symbol: string,
  timeframe: string,
  finalSignal: string,
  strategySignals: Record<string, any>,
  riskData?: any
): AlertContext {
  const context: AlertContext = {
    ts: new Date().toISOString(),
    symbol,
    timeframe,
    side: finalSignal,
    ema_rsi: strategySignals.ema_rsi || 'None',
    breakout: strategySignals.breakout || 'None',
    mr: strategySignals.mr || 'None'
  };
  
  if (riskData) {
    context.rr = riskData.rr;
    context.sl = riskData.stopLoss;
    context.tp = riskData.takeProfit;
  }
  
  return context;
}
