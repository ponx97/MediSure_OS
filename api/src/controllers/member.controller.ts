import { Request, Response, NextFunction } from 'express';
import * as memberService from '../services/member.service';
import { AppError } from '../utils/AppError';

export const createMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await memberService.create(req.body);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await memberService.findAll();
    res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};

export const getMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await memberService.findById(req.params.id);
    if (!member) throw new AppError('Member not found', 404);
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await memberService.update(req.params.id, req.body);
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await memberService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
