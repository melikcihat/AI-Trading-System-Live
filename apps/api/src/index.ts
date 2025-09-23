import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'HubAI Trader API'
  });
});

// Import and use routes
import signalRoutes from './routes/signal';
import riskRoutes from './routes/risk';
import backtestRoutes from './routes/backtest';
import positionRoutes from './routes/positions';
import marketDataRoutes from './routes/market-data';
import strategyRoutes from './routes/strategy';
import strategyProfileRoutes from './routes/strategyProfiles';
import optimizeRoutes from './routes/optimize';
import performanceRoutes from './routes/performance';
import emergencyRoutes from './routes/emergency';
import productionRoutes from './routes/production';
import alertRoutes from './routes/alerts';
import auditRoutes from './routes/audit';

app.use('/api', signalRoutes);
app.use('/api', riskRoutes);
app.use('/api', backtestRoutes);
app.use('/api', positionRoutes);
app.use('/api', marketDataRoutes);
app.use('/api', strategyRoutes);
app.use('/api', strategyProfileRoutes);
app.use('/api', optimizeRoutes);
app.use('/api', performanceRoutes);
app.use('/api', emergencyRoutes);
app.use('/api', productionRoutes);
app.use('/api', alertRoutes);
app.use('/api', auditRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
