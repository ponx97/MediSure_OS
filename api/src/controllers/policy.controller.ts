import { Request, Response, NextFunction } from 'express';
import * as policyService from '../services/policy.service';
import { AppError } from '../utils/AppError';

export const createPolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await policyService.create(req.body);
    res.status(201).json(policy);
  } catch (error) { next(error); }
};

export const getPolicies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policies = await policyService.findAll();
    res.status(200).json(policies);
  } catch (error) { next(error); }
};

export const getPolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await policyService.findById(req.params.id);
    if (!policy) throw new AppError('Policy not found', 404);
    res.status(200).json(policy);
  } catch (error) { next(error); }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await policyService.update(req.params.id, req.body);
    res.status(200).json(policy);
  } catch (error) { next(error); }
};

export const deletePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await policyService.remove(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
};
