import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';

export class AuthController {
  public async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        correlationId: req.correlationId,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.body.refreshToken);
      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
