import { createAuditLog } from '../../models/auditLog';
import { getRenderedAlert, createSignalContext } from './templates';
import { shouldSendAlert } from './dedupe';

// Rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_PER_MIN = Number(process.env.ALERTS_RATE_PER_MIN || 20);

function checkRateLimit(channel: string): boolean {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  const requests = rateLimitMap.get(channel) || 0;
  if (requests >= RATE_LIMIT_PER_MIN) {
    return false;
  }
  
  rateLimitMap.set(channel, requests + 1);
  
  // Clean up old entries
  setTimeout(() => {
    const current = rateLimitMap.get(channel) || 0;
    if (current > 0) {
      rateLimitMap.set(channel, current - 1);
    }
  }, 60000);
  
  return true;
}

export async function sendTelegram(text: string): Promise<void> {
  if (process.env.ALERTS_ENABLED !== 'true' || !process.env.TELEGRAM_BOT_TOKEN) {
    return;
  }
  if (!checkRateLimit('telegram')) {
    console.warn('Telegram rate limit exceeded');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = { 
      chat_id: process.env.TELEGRAM_CHAT_ID, 
      text: text.substring(0, 4096) // Telegram limit
    };
    
    const response = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    });
    
    if (!response.ok) {
      console.error('Telegram send failed:', await response.text());
    }
  } catch (error) {
    console.error('Telegram error:', error);
  }
}

export async function sendDiscord(text: string): Promise<void> {
  if (process.env.ALERTS_ENABLED !== 'true' || !process.env.DISCORD_WEBHOOK_URL) {
    return;
  }
  if (!checkRateLimit('discord')) {
    console.warn('Discord rate limit exceeded');
    return;
  }
  
  try {
    const body = { 
      content: text.substring(0, 2000) // Discord limit
    };
    
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      console.error('Discord send failed:', await response.text());
    }
  } catch (error) {
    console.error('Discord error:', error);
  }
}

export async function notifyAll(event: { type: string; payload: any; userId?: number }): Promise<void> {
  const timestamp = new Date().toISOString();
  const msg = `[${event.type}] ${timestamp}\n${JSON.stringify(event.payload, null, 2).substring(0, 800)}`;
  
  // Send to both channels
  await Promise.all([
    sendTelegram(msg),
    sendDiscord(msg)
  ]);
  
  // Log to audit
  try {
    await createAuditLog({
      userId: event.userId,
      action: 'ALERT_SENT',
      summary: `${event.type} notification sent`,
      payload: { type: event.type, channels: ['telegram', 'discord'] }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

export async function notifySignal(
  symbol: string,
  timeframe: string,
  finalSignal: string,
  strategySignals: Record<string, any>,
  riskData?: any
): Promise<void> {
  if (process.env.ALERTS_ENABLED !== 'true') return;
  if (!shouldSendAlert(symbol, timeframe, finalSignal)) return;
  
  const context = createSignalContext(symbol, timeframe, finalSignal, strategySignals, riskData);
  
  const [telegramMessage, discordMessage] = await Promise.all([
    getRenderedAlert('signal_default', 'TELEGRAM', context),
    getRenderedAlert('signal_default', 'DISCORD', context)
  ]);
  
  if (telegramMessage) {
    await sendTelegram(telegramMessage);
  }
  
  if (discordMessage) {
    await sendDiscord(discordMessage);
  }
}

export async function sendTestMessage(): Promise<void> {
  const testMsg = `🧪 Test message from HubAI Trader\nTimestamp: ${new Date().toISOString()}`;
  
  await Promise.all([
    sendTelegram(testMsg),
    sendDiscord(testMsg)
  ]);
}
