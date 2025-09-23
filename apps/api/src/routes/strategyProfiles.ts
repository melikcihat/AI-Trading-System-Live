import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  createProfile, 
  getProfiles, 
  getProfile, 
  updateProfile, 
  deleteProfile, 
  activateProfile 
} from '../controllers/strategyProfileController';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 60)
});

// Strategy profiles routes
router.get('/profiles', limiter, getProfiles);
router.get('/profiles/:id', limiter, getProfile);
router.post('/profiles', limiter, createProfile);
router.put('/profiles/:id', limiter, updateProfile);
router.delete('/profiles/:id', limiter, deleteProfile);
router.post('/profiles/:id/activate', limiter, activateProfile);

export default router;
