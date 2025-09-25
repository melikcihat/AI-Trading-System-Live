import { Request, Response } from 'express';
import { getCurrentExchange } from '../domain/exchange';
import { getBinanceFilters, validateOrder } from '../domain/exchange/binance-filters';
import { EmergencyManager } from '../domain/safety/emergency';
import { createAuditLog } from '../models/auditLog';

export async function getProductionStatus(req: Request, res: Response) {
  try {
    const emergencyManager = EmergencyManager.getInstance();
    const controls = emergencyManager.getControls();
    
    // Check exchange connectivity
    let exchangeStatus = 'unknown';
    try {
      await getCurrentExchange().getExchangeInfo();
      exchangeStatus = 'connected';
    } catch (error) {
      exchangeStatus = 'disconnected';
    }

    // Check environment variables
    const envChecks = {
      safetyLock: process.env.SAFETY_LOCK === 'true',
      allowedSymbols: process.env.ALLOWED_SYMBOLS || 'BTCUSDT,ETHUSDT',
      sessionWindow: process.env.SESSION_WINDOW || null,
      maxCorrelatedPositions: process.env.MAX_CORRELATED_POSITIONS || '3',
      shadowHedging: process.env.SHADOW_HEDGING === 'true',
      binanceTestnet: process.env.BINANCE_TESTNET === 'true',
      alertsEnabled: process.env.ALERTS_ENABLED === 'true'
    };

    // Check if we're in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    const isTestnet = process.env.BINANCE_TESTNET === 'true';

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        isProduction,
        isTestnet,
        nodeEnv: process.env.NODE_ENV
      },
      exchange: {
        status: exchangeStatus,
        type: process.env.EXCHANGE || 'mock'
      },
      safety: {
        controls,
        tradingAllowed: emergencyManager.isTradingAllowed()
      },
      configuration: envChecks
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function validateOrderWithFilters(req: Request, res: Response) {
  try {
    const { symbol, qty, price } = req.body;
    
    if (!symbol || !qty || !price) {
      return res.status(400).json({ error: 'Symbol, quantity, and price are required' });
    }

    const filters = await getBinanceFilters(symbol);
    const validation = validateOrder(filters, qty, price);

    await createAuditLog({
      userId: 1, // TODO: get from auth
      action: 'ORDER_VALIDATION',
      summary: `Order validation for ${symbol}`,
      payload: { symbol, qty, price, validation }
    });

    res.json({
      symbol,
      originalQty: qty,
      originalPrice: price,
      validation,
      filters: {
        lotSize: filters.lotSize,
        priceFilter: filters.priceFilter,
        minNotional: filters.minNotional
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function runPreFlightChecks(req: Request, res: Response) {
  try {
    const checks = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        isTestnet: process.env.BINANCE_TESTNET === 'true'
      },
      safety: {
        safetyLock: process.env.SAFETY_LOCK === 'true',
        allowedSymbols: (process.env.ALLOWED_SYMBOLS || '').split(',').filter(s => s),
        sessionWindow: process.env.SESSION_WINDOW ? JSON.parse(process.env.SESSION_WINDOW) : null,
        emergencyManager: false,
        tradingAllowed: false,
        error: null
      },
      exchange: {
        type: process.env.EXCHANGE || 'mock',
        apiKey: !!process.env.BINANCE_API_KEY,
        apiSecret: !!process.env.BINANCE_API_SECRET,
        connected: false,
        error: null
      },
      alerts: {
        enabled: process.env.ALERTS_ENABLED === 'true',
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        discord: !!process.env.DISCORD_WEBHOOK_URL
      },
      database: {
        url: !!process.env.DATABASE_URL
      }
    };

    // Test exchange connectivity
    try {
      await getCurrentExchange().getExchangeInfo();
      checks.exchange.connected = true;
    } catch (error) {
      checks.exchange.connected = false;
      checks.exchange.error = error instanceof Error ? error.message : String(error);
    }

    // Test emergency manager
    try {
      const emergencyManager = EmergencyManager.getInstance();
      checks.safety.emergencyManager = true;
      checks.safety.tradingAllowed = emergencyManager.isTradingAllowed();
    } catch (error) {
      checks.safety.emergencyManager = false;
      checks.safety.error = error instanceof Error ? error.message : String(error);
    }

    const allChecksPass = 
      checks.environment.isProduction &&
      checks.safety.safetyLock &&
      checks.exchange.connected &&
      checks.alerts.enabled &&
      checks.database.url;

    res.json({
      status: allChecksPass ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
      recommendations: allChecksPass ? [] : [
        'Ensure all environment variables are set',
        'Verify exchange connectivity',
        'Check safety lock status',
        'Validate alert configurations'
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
