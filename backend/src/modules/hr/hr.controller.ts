import { Request, Response, NextFunction } from 'express';
import { hrService } from './hr.service.js';

export class HrController {
  // Employees
  public async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getEmployees(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.createEmployee(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async updateLifecycle(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.updateLifecycleStatus(
        req.params.orgId,
        req.params.id,
        req.body.toStatus,
        req.body.remarks,
        req.user!.id
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Attendance
  public async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getAttendance(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async recordAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.recordAttendance(req.params.orgId, req.body);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Leaves
  public async getLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getLeaves(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.createLeaveRequest(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async approveLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.approveLeave(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Payroll
  public async getPayrollRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getPayrollRuns(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async generatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.generatePayroll(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async postPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.postPayroll(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // BI
  public async getWorkforceBi(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hrService.getWorkforceBi(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }
}

export const hrController = new HrController();
