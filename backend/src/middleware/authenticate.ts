import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError.js';
import { verifyAccessToken, JwtPayload } from '../utils/token.js';
import { User } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isSuperAdmin: boolean;
      };
      tenant?: {
        organizationId: string;
        roleId: string;
        permissions: string[];
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    const payload: JwtPayload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select('_id isActive isSuperAdmin email');
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or suspended');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token has expired'));
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Access token is invalid'));
      return;
    }
    next(error);
  }
};
