import { Request, Response } from 'express';
import { getEquityDaily, getLatestEquity } from '../models/equityDaily';
import { getTradeExecutions, getTradeStats } from '../models/tradeExecution';
import { getTradeJournal as getJournal } from '../models/tradeJournal';

export async function getPerformanceSummary(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
    const symbol = req.query.symbol as string;

    // Get equity data
    const equityData = await getEquityDaily(userId, fromDate, toDate);
    
    // Get trade stats
    const tradeStats = await getTradeStats(userId, fromDate, toDate);
    
    // Calculate additional metrics
    const totalPnL = equityData.length > 0 ? 
      equityData[equityData.length - 1].equity - equityData[0].equity : 0;
    
    const winRate = tradeStats.totalTrades > 0 ? 
      tradeStats.winningTrades / tradeStats.totalTrades : 0;
    
    // Calculate max drawdown
    let maxDD = 0;
    let peak = 0;
    for (const data of equityData) {
      if (data.equity > peak) peak = data.equity;
      const drawdown = (peak - data.equity) / peak;
      if (drawdown > maxDD) maxDD = drawdown;
    }

    // Calculate profit factor
    const profitFactor = tradeStats.losingTrades > 0 ? 
      Math.abs(tradeStats.winningTrades * tradeStats.avgTrade) / 
      Math.abs(tradeStats.losingTrades * tradeStats.avgTrade) : 0;

    res.json({
      summary: {
        totalPnL,
        winRate,
        maxDD,
        profitFactor,
        totalTrades: tradeStats.totalTrades,
        bestTrade: tradeStats.bestTrade,
        worstTrade: tradeStats.worstTrade,
        avgTrade: tradeStats.avgTrade
      },
      equityData: equityData.map(d => ({
        date: d.date,
        equity: d.equity,
        realizedPnl: d.realizedPnl,
        unrealizedPnl: d.unrealizedPnl
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEquityCurve(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

    const equityData = await getEquityDaily(userId, fromDate, toDate);

    res.json({
      curve: equityData.map(d => ({
        date: d.date,
        equity: d.equity,
        realizedPnl: d.realizedPnl,
        unrealizedPnl: d.unrealizedPnl
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMonthlyHeatmap(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const fromDate = new Date(year, 0, 1);
    const toDate = new Date(year, 11, 31);

    const equityData = await getEquityDaily(userId, fromDate, toDate);

    // Group by month and calculate returns
    const monthlyReturns: Record<string, number> = {};
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      const monthData = equityData.filter(d => 
        d.date >= monthStart && d.date <= monthEnd
      );
      
      if (monthData.length > 0) {
        const startEquity = monthData[0].equity;
        const endEquity = monthData[monthData.length - 1].equity;
        const returnPct = startEquity > 0 ? (endEquity - startEquity) / startEquity : 0;
        
        monthlyReturns[month.toString()] = returnPct;
      } else {
        monthlyReturns[month.toString()] = 0;
      }
    }

    res.json({
      year,
      monthlyReturns
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTradeJournal(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const symbol = req.query.symbol as string;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const journal = await getJournal(userId, symbol);

    res.json({ journal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createTradeJournalEntry(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const { execId, symbol, tags, note, screenshotUrl } = req.body;

    const { createTradeJournal } = await import('../models/tradeJournal');
    const entry = await createTradeJournal({
      userId,
      execId,
      symbol,
      tags,
      note,
      screenshotUrl
    });

    res.json(entry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateTradeJournalEntry(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; // TODO: get from auth
    const id = parseInt(req.params.id);
    const { tags, note, screenshotUrl } = req.body;

    const { updateTradeJournal } = await import('../models/tradeJournal');
    const entry = await updateTradeJournal(id, userId, {
      tags,
      note,
      screenshotUrl
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
