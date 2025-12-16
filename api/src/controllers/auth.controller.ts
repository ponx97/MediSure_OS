import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.register(email, password, role);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.status(200).json({ message: 'Logged out successfully' });
};
