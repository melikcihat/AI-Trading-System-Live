import { Router } from 'express';
import { getCurrentExchange } from '../domain/exchange';
import { ensureTradingAllowed, checkIdempotency, markIdempotency, acquireSymbolLock, releaseSymbolLock, logSafetyViolation } from '../middleware/safety';
import { positionSizeBase, notional } from '../domain/risk/risk';
import { notifyAll } from '../domain/alerts/notifier';
import { createAuditLog } from '../models/auditLog';
import { EmergencyManager } from '../domain/safety/emergency';
import { getBinanceFilters, validateOrder } from '../domain/exchange/binance-filters';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Get current exchange instance
const exchange = getCurrentExchange();

router.get('/positions', async (req, res) => {
  try {
    const positions = await exchange.getPositions();
    return res.json({ positions });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orderId = req.query.id as string;
    if (orderId) {
      const order = await exchange.getOrder(orderId);
      return res.json({ order });
    } else {
      // For mock exchange, we can get all orders
      // For real exchanges, we'd need to implement getOrders method
      return res.json({ orders: [] });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const balance = await exchange.getBalance();
    return res.json({ balance });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
});

router.post('/orders', idempotencyMiddleware(), async (req, res) => {
  try {
    const { symbol, side, qty, price, type, entryPrice, equity, riskPct, stopDistPct } = req.body;
    const userId = 1; // In real app, get from auth

    // Emergency controls check
    const emergencyManager = EmergencyManager.getInstance();
    if (!emergencyManager.isTradingAllowed()) {
      return res.status(403).json({ error: 'trading disabled by emergency controls' });
    }

    if (!emergencyManager.isSymbolAllowed(symbol)) {
      return res.status(403).json({ error: `symbol ${symbol} not allowed` });
    }

    // Concurrency lock
    if (!acquireSymbolLock(symbol)) {
      return res.status(429).json({ error: 'order in progress for this symbol' });
    }

    try {
      // Calculate position size and notional
      const calculatedQty = qty || positionSizeBase(entryPrice || 100, equity || 1000, riskPct || 0.01, stopDistPct || 0.005);
      const calculatedNotional = notional(entryPrice || 100, calculatedQty);

      // Safety checks
      const todayLossPct = 0; // In real app, calculate from actual trades
      ensureTradingAllowed({
        equity: equity || 1000,
        proposedNotional: calculatedNotional,
        todayLossPct,
        userId
      });

      // Binance filters validation
      let finalQty = calculatedQty;
      let finalPrice = price || entryPrice || 100;
      
      try {
        const filters = await getBinanceFilters(symbol);
        const validation = validateOrder(filters, finalQty, finalPrice);
        
        if (!validation.valid) {
          console.warn(`Order validation failed for ${symbol}:`, validation.errors);
          // Use adjusted values if available
          if (validation.adjustedQty) finalQty = validation.adjustedQty;
          if (validation.adjustedPrice) finalPrice = validation.adjustedPrice;
        }
      } catch (filterError) {
        console.warn(`Filter validation failed for ${symbol}:`, filterError);
        // Continue with original values if filter validation fails
      }

      // Place order
      const result = await exchange.placeOrder({
        symbol,
        side,
        qty: finalQty,
        price: finalPrice,
        type
      });

      // Log to audit
      await createAuditLog({
        userId,
        action: 'ORDER_PLACE',
        summary: `Order placed: ${side} ${finalQty} ${symbol}`,
        payload: { symbol, side, qty: finalQty, price: finalPrice, type, orderId: result.id }
      });

      // Send notification
      await notifyAll({
        type: 'ORDER_PLACE',
        payload: { symbol, side, qty: finalQty, price: finalPrice, type, orderId: result.id },
        userId
      });

      return res.json({ orderId: result.id, qty: finalQty, price: finalPrice });
    } finally {
      releaseSymbolLock(symbol);
    }
  } catch (e: any) {
    const error = e?.message || 'Bad Request';

    // Log safety violations
    if (error.includes('trading disabled') || error.includes('daily loss limit') || error.includes('max notional')) {
      await logSafetyViolation(error, {
        equity: req.body.equity || 1000,
        proposedNotional: req.body.qty * (req.body.entryPrice || 100),
        todayLossPct: 0,
        userId: 1
      }, req.body);
    }

    return res.status(400).json({ error });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await exchange.cancelOrder(orderId);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Bad Request' });
  }
});

export default router;
