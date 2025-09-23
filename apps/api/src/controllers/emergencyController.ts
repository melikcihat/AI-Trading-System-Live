import { Request, Response } from 'express';
import { EmergencyManager } from '../domain/safety/emergency';
import { createAuditLog } from '../models/auditLog';

export async function getEmergencyStatus(req: Request, res: Response) {
  try {
    const emergencyManager = EmergencyManager.getInstance();
    const controls = emergencyManager.getControls();
    
    res.json({
      controls,
      isTradingAllowed: emergencyManager.isTradingAllowed(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function panicStop(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const emergencyManager = EmergencyManager.getInstance();
    
    await emergencyManager.panicStop(userId);
    
    res.json({ 
      success: true, 
      message: 'Emergency stop activated',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function partialStop(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    const emergencyManager = EmergencyManager.getInstance();
    await emergencyManager.partialStop(symbols, userId);
    
    res.json({ 
      success: true, 
      message: `Partial stop activated for symbols: ${symbols.join(', ')}`,
      symbols,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateSafetyControls(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const updates = req.body;
    
    const emergencyManager = EmergencyManager.getInstance();
    emergencyManager.updateControls(updates, userId);
    
    res.json({ 
      success: true, 
      message: 'Safety controls updated',
      controls: emergencyManager.getControls(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function validateTradingConditions(req: Request, res: Response) {
  try {
    const { symbol, qty, price } = req.body;
    const emergencyManager = EmergencyManager.getInstance();
    
    const validations = {
      tradingAllowed: emergencyManager.isTradingAllowed(),
      symbolAllowed: emergencyManager.isSymbolAllowed(symbol),
      inSessionWindow: emergencyManager.isInSessionWindow(),
      safetyLock: emergencyManager.getControls().safetyLock
    };
    
    const allValid = Object.values(validations).every(v => v === true);
    
    res.json({
      valid: allValid,
      validations,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
