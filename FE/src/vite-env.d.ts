/// <reference types="vite/client" />

interface TossPaymentsV2RequestPaymentOptions {
  method: 'CARD' | 'TRANSFER' | 'VIRTUAL_ACCOUNT' | 'MOBILE_PHONE' | 'CULTURE_GIFT_CERTIFICATE' | 'FOREIGN_EASY_PAY';
  amount: { currency: 'KRW'; value: number };
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
  card?: Record<string, unknown>;
}

interface TossPaymentsV2Payment {
  requestPayment(options: TossPaymentsV2RequestPaymentOptions): Promise<void>;
}

interface TossPaymentsV2Instance {
  payment(options: { customerKey: string }): TossPaymentsV2Payment;
}

interface Window {
  TossPayments?: (clientKey: string) => TossPaymentsV2Instance;
}

interface ImportMetaEnv {
  readonly VITE_TOSS_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
