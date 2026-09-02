import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';
import { CompanyUser } from '../models/CompanyUser.js';
import { Role } from '../models/Role.js';

export const tenantContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User must be authenticated to access tenant resources');
    }

    const orgId = req.params.orgId;
    if (!orgId) {
      next();
      return;
    }

    if (req.user.isSuperAdmin) {
      req.tenant = {
        organizationId: orgId,
        roleId: 'superadmin',
        permissions: ['*'],
      };
      next();
      return;
    }

    const membership = await CompanyUser.findOne({
      organizationId: orgId,
      userId: req.user.id,
      status: 'active',
    });

    if (!membership) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const role = await Role.findById(membership.roleId);
    if (!role) {
      throw new ForbiddenError('No role assigned to user for this organization');
    }

    req.tenant = {
      organizationId: orgId,
      roleId: role._id.toString(),
      permissions: role.permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
};
