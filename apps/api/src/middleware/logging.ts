import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: any;
}

function createLogEntry(level: LogEntry['level'], message: string, req?: Request, res?: Response, error?: any): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message
  };

  if (req) {
    entry.method = req.method;
    entry.url = req.url;
    entry.userAgent = req.get('User-Agent');
    entry.ip = req.ip || req.connection.remoteAddress;
    entry.userId = (req as any).user?.id;
  }

  if (res) {
    entry.statusCode = res.statusCode;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return entry;
}

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    
    const logEntry = createLogEntry(
      level,
      `${req.method} ${req.url} - ${res.statusCode}`,
      req,
      res
    );
    
    logEntry.responseTime = responseTime;
    
    console.log(JSON.stringify(logEntry));
  });
  
  next();
}

export function errorLoggingMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  const logEntry = createLogEntry(
    'error',
    `Unhandled error: ${error.message}`,
    req,
    res,
    error
  );
  
  console.error(JSON.stringify(logEntry));
  
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
