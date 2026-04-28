import type { NextFunction, Request, Response } from 'express';

export function requireFutureAuth(_request: Request, _response: Response, next: NextFunction) {
  next();
}
