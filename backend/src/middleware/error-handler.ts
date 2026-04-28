import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { errorResponse } from '../utils/api.js';

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json(errorResponse('Validation error', error.flatten()));
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json(errorResponse(error.message, error.details));
  }

  console.error('[backend:error]', error);
  return response.status(500).json(errorResponse('Internal server error'));
}
