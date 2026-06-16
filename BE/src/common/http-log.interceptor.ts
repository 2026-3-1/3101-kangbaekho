import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

import { metrics } from './metrics';
import { RequestWithContext } from './request-context.middleware';

@Injectable()
export class HttpLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & Partial<RequestWithContext>>();
    const res = http.getResponse<Response>();
    if (!req.requestId) {
      // 미들웨어 미적용 경로(혹은 Nest 11 path-to-regexp 변화) 대비 안전망
      req.requestId =
        (req.headers['x-request-id'] as string) || randomUUID();
      req.startedAt = req.startedAt ?? Date.now();
      res.setHeader('x-request-id', req.requestId);
    }
    const startedAt = req.startedAt ?? Date.now();
    const method = req.method;
    const url = req.originalUrl ?? req.url;
    const requestId = req.requestId;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startedAt;
          metrics.recordRequest(ms, res.statusCode);
          this.logJson({
            level: 'info',
            event: 'http.request',
            requestId,
            method,
            url,
            status: res.statusCode,
            duration_ms: ms,
          });
        },
        error: (err) => {
          const ms = Date.now() - startedAt;
          const status =
            (err as { status?: number }).status ?? res.statusCode ?? 500;
          metrics.recordRequest(ms, status);
          metrics.incError();
          this.logJson({
            level: 'error',
            event: 'http.request',
            requestId,
            method,
            url,
            status,
            duration_ms: ms,
            err: (err as Error).message ?? String(err),
          });
        },
      }),
    );
  }

  private logJson(payload: Record<string, unknown>) {
    // 운영 환경에서는 JSON 한 줄 — 수집기(Loki/CloudWatch/등) 친화
    const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
    if (payload.level === 'error') this.logger.error(line);
    else this.logger.log(line);
  }
}
