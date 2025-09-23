import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  registers: [register]
});

const signalsGeneratedTotal = new client.Counter({
  name: 'signals_generated_total',
  help: 'Total number of signals generated',
  labelNames: ['signal_type'],
  registers: [register]
});

const ordersPlacedTotal = new client.Counter({
  name: 'orders_placed_total',
  help: 'Total number of orders placed',
  labelNames: ['exchange', 'side'],
  registers: [register]
});

const riskBlockTotal = new client.Counter({
  name: 'risk_block_total',
  help: 'Total number of risk blocks',
  labelNames: ['reason'],
  registers: [register]
});

// Middleware to collect metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route)
      .observe(duration);
  });
  
  next();
}

// Metrics endpoint
export function metricsHandler(req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}

// Helper functions to increment custom metrics
export function incrementSignalsGenerated(signalType: string) {
  signalsGeneratedTotal.labels(signalType).inc();
}

export function incrementOrdersPlaced(exchange: string, side: string) {
  ordersPlacedTotal.labels(exchange, side).inc();
}

export function incrementRiskBlock(reason: string) {
  riskBlockTotal.labels(reason).inc();
}
