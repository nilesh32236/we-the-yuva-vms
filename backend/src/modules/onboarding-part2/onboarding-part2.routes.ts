import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Part2Schema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getPart2Handler, putPart2Handler } from './onboarding-part2.controller';

export const onboardingPart2Router: Router = Router();

onboardingPart2Router.use(requireAuth);

const part2PutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many Part II submissions. Please try again later.' },
});

onboardingPart2Router.get('/', getPart2Handler);

onboardingPart2Router.put('/', part2PutLimiter, validate(Part2Schema), putPart2Handler);
