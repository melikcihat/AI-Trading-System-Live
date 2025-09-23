import { createAuditLog } from '../../models/auditLog';

export async function sendTelegram(text: string): Promise<void> {
  if (process.env.ALERTS_ENABLED !== 'true' || !process.env.TELEGRAM_BOT_TOKEN) {
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

export async function sendTestMessage(): Promise<void> {
  const testMsg = `🧪 Test message from HubAI Trader\nTimestamp: ${new Date().toISOString()}`;
  
  await Promise.all([
    sendTelegram(testMsg),
    sendDiscord(testMsg)
  ]);
}
