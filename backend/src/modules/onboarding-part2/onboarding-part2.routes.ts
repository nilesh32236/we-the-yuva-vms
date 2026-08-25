import { Router } from 'express';
import { Part2Schema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getPart2Handler, putPart2Handler } from './onboarding-part2.controller';

export const onboardingPart2Router: Router = Router();

onboardingPart2Router.use(requireAuth);

onboardingPart2Router.get('/', getPart2Handler);

onboardingPart2Router.put('/', validate(Part2Schema), putPart2Handler);
