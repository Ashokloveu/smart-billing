import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../../models/Notification.js';

export class NotificationController {
  public async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const orgObjectId = new mongoose.Types.ObjectId(req.params.orgId);
      const items = await Notification.find({ organizationId: orgObjectId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      const unreadCount = await Notification.countDocuments({
        organizationId: orgObjectId,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: { items, unreadCount },
      });
    } catch (e) {
      next(e);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const orgObjectId = new mongoose.Types.ObjectId(req.params.orgId);
      await Notification.updateMany(
        { organizationId: orgObjectId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: { message: 'All notifications marked as read' },
      });
    } catch (e) {
      next(e);
    }
  }
}

export const notificationController = new NotificationController();
