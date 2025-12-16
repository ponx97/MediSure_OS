import { Request, Response, NextFunction } from 'express';
import * as claimService from '../services/claim.service';
import { AppError } from '../utils/AppError';

export const createClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await claimService.create(req.body, req.user!.id);
    res.status(201).json(claim);
  } catch (error) { next(error); }
};

export const getClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = await claimService.findAll();
    res.status(200).json(claims);
  } catch (error) { next(error); }
};

export const getClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await claimService.findById(req.params.id);
    if (!claim) throw new AppError('Claim not found', 404);
    res.status(200).json(claim);
  } catch (error) { next(error); }
};

export const submitClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await claimService.submit(req.params.id, req.user!.id);
    res.status(200).json(claim);
  } catch (error) { next(error); }
};

export const reviewClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const claim = await claimService.review(req.params.id, notes, req.user!.id);
    res.status(200).json(claim);
  } catch (error) { next(error); }
};

export const approveClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountApproved, notes } = req.body;
    const claim = await claimService.approve(req.params.id, amountApproved, notes, req.user!.id);
    res.status(200).json(claim);
  } catch (error) { next(error); }
};

export const rejectClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const claim = await claimService.reject(req.params.id, notes, req.user!.id);
    res.status(200).json(claim);
  } catch (error) { next(error); }
};

export const payClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paidAmount, reference } = req.body;
    const result = await claimService.pay(req.params.id, paidAmount, reference, req.user!.id);
    res.status(200).json(result);
  } catch (error) { next(error); }
};

export const addItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await claimService.addClaimItem(req.params.id, req.body);
    res.status(201).json(item);
  } catch (error) { next(error); }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: This route structure /claims/:id/items/:itemId might be better, but assuming flat /items/:itemId for delete logic or handled here
    // Based on requirement: /claims/:id/items
    // If request is DELETE /claims/:id/items/:itemId
    // Just implementing logic here
    // But express routes usually need param for itemId.
    // I will assume the route definition handles it.
    // Wait, the prompt says "endpoints: create/update/delete claim items under /claims/:id/items".
    // DELETE /claims/:id/items/:itemId makes sense.
    await claimService.removeClaimItem(req.params.itemId);
    res.status(204).send();
  } catch (error) { next(error); }
};
