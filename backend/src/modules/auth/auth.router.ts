import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { signupSchema, loginSchema, refreshSchema } from './auth.validation.js';

const router = Router();

router.post('/signup', validateRequest(signupSchema), (req, res, next) =>
  authController.signup(req, res, next)
);

router.post('/login', validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', validateRequest(refreshSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getProfile(req, res, next)
);

export const authRouter = router;
