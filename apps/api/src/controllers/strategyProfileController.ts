import { Request, Response } from 'express';
import { 
  createStrategyProfile, 
  getStrategyProfiles, 
  getStrategyProfile, 
  updateStrategyProfile, 
  deleteStrategyProfile, 
  activateStrategyProfile 
} from '../models/strategyProfile';
import { validateStrategyParams } from '../domain/strategy/registry';
import { createAuditLog } from '../models/auditLog';

export async function createProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { name, symbol, timeframe, strategies, aggregateRule, priorityOrder } = req.body;

    // Validate strategies
    for (const strategy of strategies) {
      validateStrategyParams(strategy.key, strategy.params);
    }

    const profile = await createStrategyProfile({
      userId,
      name,
      symbol,
      timeframe,
      strategies,
      aggregateRule: aggregateRule || 'PRIORITY',
      priorityOrder: priorityOrder || [0, 1, 2],
      active: false
    });

    await createAuditLog({
      userId,
      action: 'STRATEGY_PROFILE_CREATED',
      summary: `Profile created: ${name} for ${symbol}/${timeframe}`,
      payload: { profileId: profile.id, name, symbol, timeframe }
    });

    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getProfiles(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const profiles = await getStrategyProfiles(userId);
    res.json({ profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const id = parseInt(req.params.id);
    const profile = await getStrategyProfile(id, userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const id = parseInt(req.params.id);
    const updates = req.body;

    // Validate strategies if provided
    if (updates.strategies) {
      for (const strategy of updates.strategies) {
        validateStrategyParams(strategy.key, strategy.params);
      }
    }

    const profile = await updateStrategyProfile(id, userId, updates);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await createAuditLog({
      userId,
      action: 'STRATEGY_PROFILE_UPDATED',
      summary: `Profile updated: ${profile.name}`,
      payload: { profileId: id, updates }
    });

    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const id = parseInt(req.params.id);
    
    const success = await deleteStrategyProfile(id, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await createAuditLog({
      userId,
      action: 'STRATEGY_PROFILE_DELETED',
      summary: `Profile deleted: ${id}`,
      payload: { profileId: id }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function activateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const id = parseInt(req.params.id);
    
    const profile = await activateStrategyProfile(id, userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await createAuditLog({
      userId,
      action: 'STRATEGY_PROFILE_ACTIVATED',
      summary: `Profile activated: ${profile.name}`,
      payload: { profileId: id, name: profile.name }
    });

    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
