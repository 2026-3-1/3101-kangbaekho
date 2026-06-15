import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        (typeof data.message === 'string' && data.message) ||
        `Toss 결제 승인 실패 (HTTP ${res.status})`;
      this.logger.warn(`Toss confirm failed: ${message}`);
      throw new BadRequestException(message);
    }
    return data as unknown as TossConfirmResponse;
  }
}
