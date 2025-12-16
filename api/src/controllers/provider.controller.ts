import { Request, Response, NextFunction } from 'express';
import * as providerService from '../services/provider.service';
import { AppError } from '../utils/AppError';

export const createProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await providerService.create(req.body);
    res.status(201).json(provider);
  } catch (error) { next(error); }
};

export const getProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await providerService.findAll();
    res.status(200).json(providers);
  } catch (error) { next(error); }
};

export const getProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await providerService.findById(req.params.id);
    if (!provider) throw new AppError('Provider not found', 404);
    res.status(200).json(provider);
  } catch (error) { next(error); }
};

export const updateProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await providerService.update(req.params.id, req.body);
    res.status(200).json(provider);
  } catch (error) { next(error); }
};

export const deleteProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await providerService.remove(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
};
