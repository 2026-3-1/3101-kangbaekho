import { Logger } from '@nestjs/common';

export interface RetryOptions {
  /** 최대 시도 횟수 (첫 시도 포함) */
  maxAttempts?: number;
  /** 최초 백오프 (ms) */
  initialDelayMs?: number;
  /** 백오프 배수 */
  multiplier?: number;
  /** 백오프 상한 (ms) */
  maxDelayMs?: number;
  /** 백오프에 더할 jitter 최대값 (ms) */
  jitterMs?: number;
  /** 재시도 가능한 에러인지 판별 — false 반환 시 즉시 throw */
  isRetryable?: (err: unknown, attempt: number) => boolean;
  /** 로깅 컨텍스트 이름 */
  label?: string;
}

const DEFAULTS: Required<Omit<RetryOptions, 'isRetryable' | 'label'>> = {
  maxAttempts: 4,
  initialDelayMs: 200,
  multiplier: 2,
  maxDelayMs: 4000,
  jitterMs: 100,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 외부 API 호출을 위한 지수 백오프 재시도 헬퍼.
 *
 * Why: 결제 PG/이메일 SMTP 등 외부 시스템은 일시적 5xx/timeout 이 잦다.
 * 동일한 idempotency key 와 함께 재시도하면 이중 처리 없이 안정성을 높일 수 있다.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };
  const logger = new Logger(`Retry${opts.label ? `:${opts.label}` : ''}`);
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const retryable = options.isRetryable
        ? options.isRetryable(err, attempt)
        : isTransient(err);
      if (!retryable || attempt >= opts.maxAttempts) {
        logger.warn(
          `attempt=${attempt}/${opts.maxAttempts} failed (giving up): ${describe(err)}`,
        );
        throw err;
      }
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.multiplier, attempt - 1),
        opts.maxDelayMs,
      );
      const jitter = Math.floor(Math.random() * opts.jitterMs);
      logger.warn(
        `attempt=${attempt}/${opts.maxAttempts} failed (retrying in ${delay + jitter}ms): ${describe(err)}`,
      );
      await sleep(delay + jitter);
    }
  }
  // 도달 불가
  throw lastError;
}

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/**
 * 기본 분류 — 네트워크/5xx/timeout은 재시도, 4xx는 즉시 fail.
 */
export function isTransient(err: unknown): boolean {
  if (!err) return false;
  const e = err as { status?: number; code?: string; name?: string; message?: string };
  if (typeof e.status === 'number') {
    if (e.status >= 500 || e.status === 408 || e.status === 429) return true;
    if (e.status >= 400 && e.status < 500) return false;
  }
  if (e.code) {
    const transientCodes = new Set([
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'ENOTFOUND',
      'EPIPE',
    ]);
    if (transientCodes.has(e.code)) return true;
  }
  if (e.name === 'AbortError') return true;
  return false;
}
