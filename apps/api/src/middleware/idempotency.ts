import { Request, Response, NextFunction } from 'express';

interface IdempotencyRecord {
  key: string;
  response: any;
  timestamp: number;
  ttl: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const DEFAULT_TTL = 60 * 1000; // 60 seconds

export function idempotencyMiddleware(ttl: number = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return next();
    }

    // Check if we have a cached response
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return res.status(409).json({
        error: 'duplicate request',
        message: 'This request has already been processed',
        idempotencyKey
      });
    }

    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody: any;

    // Override response methods to capture the response
    res.json = function(body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    res.send = function(body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.end = function(chunk?: any) {
      if (chunk) {
        responseBody = chunk;
      }
      return originalEnd.call(this, chunk, encoding, callback);
    };

    // Store the response when it's sent
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
        idempotencyStore.set(idempotencyKey, {
          key: idempotencyKey,
          response: responseBody,
          timestamp: Date.now(),
          ttl
        });
      }
    });

    next();
  };
}

export function cleanupExpiredKeys(): void {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.timestamp > record.ttl) {
      idempotencyStore.delete(key);
    }
  }
}

// Clean up expired keys every 30 seconds
setInterval(cleanupExpiredKeys, 30 * 1000);
