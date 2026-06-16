import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { withRetry } from '../common/retry.util';

export interface TossConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method?: string;
  totalAmount: number;
  [key: string]: unknown;
}

const DEFAULT_TEST_SECRET = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

@Injectable()
export class TossClient {
  private readonly logger = new Logger(TossClient.name);

  constructor(private readonly config: ConfigService) {}

  async confirm(req: TossConfirmRequest): Promise<TossConfirmResponse> {
    const secretKey =
      this.config.get<string>('TOSS_SECRET_KEY') ?? DEFAULT_TEST_SECRET;
    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    return withRetry(
      async (attempt) => {
        this.logger.log(`toss confirm attempt=${attempt} orderId=${req.orderId}`);
        const res = await fetch(
          'https://api.tosspayments.com/v1/payments/confirm',
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
              // Toss 는 동일 paymentKey 로 재호출 시 같은 결과를 보장하므로
              // paymentKey 자체가 idempotency-key 역할을 한다.
              'Idempotency-Key': req.paymentKey,
            },
            body: JSON.stringify(req),
          },
        );
        const data = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        if (!res.ok) {
          const message =
            (typeof data.message === 'string' && data.message) ||
            `Toss 결제 승인 실패 (HTTP ${res.status})`;
          this.logger.warn(`Toss confirm failed: status=${res.status} msg=${message}`);
          // 5xx / 429 → retryable, 4xx → 즉시 BadRequest
          if (res.status >= 500 || res.status === 429 || res.status === 408) {
            const err = new Error(message) as Error & { status: number };
            err.status = res.status;
            throw err;
          }
          throw new BadRequestException(message);
        }
        return data as unknown as TossConfirmResponse;
      },
      {
        label: 'toss-confirm',
        maxAttempts: 3,
        initialDelayMs: 250,
        isRetryable: (err) => {
          const e = err as { status?: number; code?: string };
          if (e.status && (e.status >= 500 || e.status === 429 || e.status === 408))
            return true;
          if (
            e.code &&
            ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(e.code)
          )
            return true;
          return false;
        },
      },
    );
  }
}
