import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

router.get('/notifications', (req, res, next) => notificationController.getNotifications(req, res, next));
router.post('/notifications/read-all', (req, res, next) => notificationController.markAsRead(req, res, next));

export const notificationRouter = router;
