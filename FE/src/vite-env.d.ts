/// <reference types="vite/client" />

interface TossPaymentsRequestPaymentOptions {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

interface TossPaymentsInstance {
  requestPayment(
    method: string,
    options: TossPaymentsRequestPaymentOptions,
  ): Promise<void>;
}

interface Window {
  TossPayments?: (clientKey: string) => TossPaymentsInstance;
}

interface ImportMetaEnv {
  readonly VITE_TOSS_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
