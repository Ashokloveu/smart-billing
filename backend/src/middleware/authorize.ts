import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export const authorize = (requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (req.user.isSuperAdmin) {
      next();
      return;
    }

    if (!req.tenant) {
      next(new ForbiddenError('Tenant authorization context missing'));
      return;
    }

    const userPermissions = req.tenant.permissions || [];
    if (userPermissions.includes('*')) {
      next();
      return;
    }

    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      next(
        new ForbiddenError(
          `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};
