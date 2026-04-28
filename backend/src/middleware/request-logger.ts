import type { NextFunction, Request, Response } from 'express';

export function requestLogger(request: Request, _response: Response, next: NextFunction) {
  console.log(`[request] ${request.method} ${request.originalUrl}`);
  next();
}
