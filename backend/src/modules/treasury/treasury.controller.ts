import { NextFunction, Request, Response } from 'express';
import { treasuryService } from './treasury.service.js';

const send = (req: Request, res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, statusCode, correlationId: req.correlationId, data });

export class TreasuryController {
  getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.getAccounts(req.params.orgId)); } catch (error) { next(error); }
  };
  createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.createAccount(req.params.orgId, req.body, req.user!.id, req.ip), 201); } catch (error) { next(error); }
  };
  getTransfers = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.getTransfers(req.params.orgId)); } catch (error) { next(error); }
  };
  createTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.createTransfer(req.params.orgId, req.body, req.user!.id, req.ip), 201); } catch (error) { next(error); }
  };
  getCheques = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.getCheques(req.params.orgId, req.query.status as string | undefined)); } catch (error) { next(error); }
  };
  createCheque = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.createCheque(req.params.orgId, req.body, req.user!.id), 201); } catch (error) { next(error); }
  };
  updateChequeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.updateChequeStatus(req.params.orgId, req.params.chequeId, req.body.status, req.user!.id)); } catch (error) { next(error); }
  };
  getLedger = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.getLedger(req.params.orgId, req.params.accountId)); } catch (error) { next(error); }
  };
  setReconciled = async (req: Request, res: Response, next: NextFunction) => {
    try { send(req, res, await treasuryService.setReconciled(req.params.orgId, req.params.accountId, req.params.journalId, req.body.reconciled, req.user!.id)); } catch (error) { next(error); }
  };
}

export const treasuryController = new TreasuryController();
