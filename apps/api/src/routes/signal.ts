import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { generateSignal } from '../domain/strategy/signal';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

router.post('/signal', limiter, (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const closes: number[] = body.closes || [];
    const params = {
      fast: body?.params?.fast ?? 9,
      slow: body?.params?.slow ?? 21,
      rsi:  body?.params?.rsi  ?? 55
    };
    const { side, meta } = generateSignal(closes, params);
    // TODO: audit insert (userId çek)
    return res.json({ signal: { side }, meta });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Bad Request' });
  }
});

export default router;
