import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = (err as ZodError).errors;
  }

  if (statusCode === 500) {
    logger.error('Unexpected Error', err);
  }

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message,
      details,
    },
  });
};