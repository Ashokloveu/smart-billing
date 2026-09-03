import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { signupSchema, loginSchema, refreshSchema } from './auth.validation.js';

import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Rate limit login: max 10 attempts per 15 minutes
router.post('/signup', validateRequest(signupSchema), (req, res, next) =>
  authController.signup(req, res, next)
);

router.post(
  '/login',
  rateLimiter(15 * 60 * 1000, 10),
  validateRequest(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/refresh',
  rateLimiter(15 * 60 * 1000, 30),
  validateRequest(refreshSchema),
  (req, res, next) => authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getProfile(req, res, next)
);

export const authRouter = router;
