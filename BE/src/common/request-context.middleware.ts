import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export interface RequestWithContext extends Request {
  requestId: string;
  startedAt: number;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = (req.headers['x-request-id'] as string) || randomUUID();
    (req as RequestWithContext).requestId = incoming;
    (req as RequestWithContext).startedAt = Date.now();
    res.setHeader('x-request-id', incoming);
    next();
  }
}
