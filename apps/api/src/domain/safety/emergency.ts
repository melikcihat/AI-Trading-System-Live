import { getCurrentExchange } from '../exchange';
import { createAuditLog } from '../../models/auditLog';
import { notifyAll } from '../alerts/notifier';

export interface EmergencyControls {
  safetyLock: boolean;
  allowedSymbols: string[];
  sessionWindow: { start: string; end: string } | null;
  maxCorrelatedPositions: number;
  shadowHedging: boolean;
}

export class EmergencyManager {
  private static instance: EmergencyManager;
  private controls: EmergencyControls;

  private constructor() {
    this.controls = {
      safetyLock: process.env.SAFETY_LOCK === 'true',
      allowedSymbols: (process.env.ALLOWED_SYMBOLS || 'BTCUSDT,ETHUSDT').split(','),
      sessionWindow: process.env.SESSION_WINDOW ? 
        JSON.parse(process.env.SESSION_WINDOW) : null,
      maxCorrelatedPositions: parseInt(process.env.MAX_CORRELATED_POSITIONS || '3'),
      shadowHedging: process.env.SHADOW_HEDGING === 'true'
    };
  }

  public static getInstance(): EmergencyManager {
    if (!EmergencyManager.instance) {
      EmergencyManager.instance = new EmergencyManager();
    }
    return EmergencyManager.instance;
  }

  public async panicStop(userId: number): Promise<void> {
    this.controls.safetyLock = true;
    process.env.SAFETY_LOCK = 'true';

    try {
      // Cancel all open orders
      const exchange = getCurrentExchange();
      const openOrders = await exchange.getOpenOrders();
      
      for (const order of openOrders) {
        try {
          await exchange.cancelOrder(order.id, order.symbol);
        } catch (error) {
          console.error(`Failed to cancel order ${order.id}:`, error);
        }
      }

      await createAuditLog({
        userId,
        action: 'PANIC_STOP',
        summary: 'Emergency stop activated - all orders cancelled',
        payload: { cancelledOrders: openOrders.length }
      });

      await notifyAll({
        type: 'EMERGENCY',
        payload: { action: 'PANIC_STOP', cancelledOrders: openOrders.length },
        userId
      });

    } catch (error) {
      console.error('Error during panic stop:', error);
    }
  }

  public async partialStop(symbols: string[], userId: number): Promise<void> {
    try {
      const exchange = getCurrentExchange();
      const openOrders = await exchange.getOpenOrders();
      
      const cancelledOrders = [];
      for (const order of openOrders) {
        if (symbols.includes(order.symbol)) {
          try {
            await exchange.cancelOrder(order.id, order.symbol);
            cancelledOrders.push(order);
          } catch (error) {
            console.error(`Failed to cancel order ${order.id}:`, error);
          }
        }
      }

      await createAuditLog({
        userId,
        action: 'PARTIAL_STOP',
        summary: `Partial stop for symbols: ${symbols.join(', ')}`,
        payload: { symbols, cancelledOrders: cancelledOrders.length }
      });

      await notifyAll({
        type: 'EMERGENCY',
        payload: { action: 'PARTIAL_STOP', symbols, cancelledOrders: cancelledOrders.length },
        userId
      });

    } catch (error) {
      console.error('Error during partial stop:', error);
    }
  }

  public isTradingAllowed(): boolean {
    return !this.controls.safetyLock && this.isInSessionWindow();
  }

  public isSymbolAllowed(symbol: string): boolean {
    return this.controls.allowedSymbols.includes(symbol);
  }

  public isInSessionWindow(): boolean {
    if (!this.controls.sessionWindow) return true;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return currentTime >= this.controls.sessionWindow.start && 
           currentTime <= this.controls.sessionWindow.end;
  }

  public async checkCorrelationLimit(positions: any[]): Promise<boolean> {
    // Simplified correlation check - in production, implement proper correlation calculation
    const longPositions = positions.filter(p => p.side === 'LONG').length;
    const shortPositions = positions.filter(p => p.side === 'SHORT').length;
    
    return Math.max(longPositions, shortPositions) < this.controls.maxCorrelatedPositions;
  }

  public getControls(): EmergencyControls {
    return { ...this.controls };
  }

  public updateControls(updates: Partial<EmergencyControls>, userId: number): void {
    this.controls = { ...this.controls, ...updates };
    
    if (updates.safetyLock !== undefined) {
      process.env.SAFETY_LOCK = updates.safetyLock.toString();
    }

    createAuditLog({
      userId,
      action: 'SAFETY_CONTROLS_UPDATE',
      summary: 'Safety controls updated',
      payload: updates
    });
  }
}
