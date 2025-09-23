import { Router } from 'express';
import { sendTestMessage, notifyAll } from '../domain/alerts/notifier';
import { createAuditLog } from '../models/auditLog';

const router = Router();

// Test alert functionality
router.post('/alerts/test', async (req, res) => {
  try {
    await sendTestMessage();
    
    // Log to audit
    await createAuditLog({
      userId: 1, // In real app, get from auth
      action: 'ALERT_TEST',
      summary: 'Test alert sent to Telegram and Discord',
      payload: { channels: ['telegram', 'discord'] }
    });
    
    res.json({ success: true, message: 'Test alerts sent' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

// Get alert configuration status
router.get('/alerts/status', (req, res) => {
  const status = {
    enabled: process.env.ALERTS_ENABLED === 'true',
    telegram: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    discord: !!process.env.DISCORD_WEBHOOK_URL
  };
  
  res.json(status);
});

// Manual alert trigger (for testing)
router.post('/alerts/trigger', async (req, res) => {
  try {
    const { type, message } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'type and message required' });
    }
    
    await notifyAll({
      type: type.toUpperCase(),
      payload: { message, timestamp: new Date().toISOString() },
      userId: 1 // In real app, get from auth
    });
    
    res.json({ success: true, message: 'Alert sent' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

export default router;
