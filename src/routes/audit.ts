import { Router } from 'express';
import { getAuditLogs } from '../models/auditLog';

const router = Router();

// Get audit logs
router.get('/audit', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    const logs = await getAuditLogs(limit, userId);
    
    // Mask sensitive data
    const maskedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId ? `user_${log.userId}` : null,
      action: log.action,
      summary: log.summary,
      payload: log.payload,
      createdAt: log.createdAt
    }));
    
    res.json({ logs: maskedLogs });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

export default router;
