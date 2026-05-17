export type RechargePackage = {
  id: string;
  amountRmb: number;
  credits: number;
};

export type PaymentMethod = "alipay" | "wechat";

export type PaymentProvider = "mock" | "live";

export type PaymentConfig = {
  provider: PaymentProvider;
  alipayMerchantId: string;
  alipayAccessKey: string;
  wechatMerchantId: string;
  wechatAccessKey: string;
};

export type PaymentRequestInput = {
  config: PaymentConfig;
  method: PaymentMethod;
  paymentId: number;
  amountRmb: number;
  credits: number;
  webroot: string;
};

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "rmb_1", amountRmb: 1, credits: 10 },
  { id: "rmb_5", amountRmb: 5, credits: 50 },
  { id: "rmb_10", amountRmb: 10, credits: 100 },
  { id: "rmb_20", amountRmb: 20, credits: 200 },
  { id: "rmb_50", amountRmb: 50, credits: 500 },
  { id: "rmb_100", amountRmb: 100, credits: 1000 },
  { id: "rmb_200", amountRmb: 200, credits: 2000 },
];

export const PAYMENT_METHODS: PaymentMethod[] = ["alipay", "wechat"];

export function getRechargePackage(packageId: string): RechargePackage | null {
  return RECHARGE_PACKAGES.find((pkg) => pkg.id === packageId) ?? null;
}

export function canCreateRechargePayment(billingEnabled: boolean): boolean {
  return billingEnabled;
}

export function isPaymentMethod(method: string): method is PaymentMethod {
  return PAYMENT_METHODS.includes(method as PaymentMethod);
}

export function getPaymentConfig(
  provider: PaymentProvider,
  env: Record<string, string | undefined> = process.env,
): PaymentConfig {
  if (provider === "mock") {
    return {
      provider,
      alipayMerchantId: "mock-alipay-merchant",
      alipayAccessKey: "mock-alipay-ak",
      wechatMerchantId: "mock-wechat-merchant",
      wechatAccessKey: "mock-wechat-ak",
    };
  }

  return {
    provider,
    alipayMerchantId: env.ALIPAY_MERCHANT_ID ?? "",
    alipayAccessKey: env.ALIPAY_ACCESS_KEY ?? "",
    wechatMerchantId: env.WECHAT_MERCHANT_ID ?? "",
    wechatAccessKey: env.WECHAT_ACCESS_KEY ?? "",
  };
}

export function createPaymentRequest(input: PaymentRequestInput): {
  paymentUrl: string;
  transactionId: string;
} {
  if (input.config.provider === "mock") {
    return {
      paymentUrl: `${input.webroot}/credits/mock-pay/${input.paymentId}?method=${input.method}`,
      transactionId: `mock-${input.method}-${input.paymentId}`,
    };
  }

  const merchantId =
    input.method === "alipay" ? input.config.alipayMerchantId : input.config.wechatMerchantId;
  const accessKey =
    input.method === "alipay" ? input.config.alipayAccessKey : input.config.wechatAccessKey;

  if (!merchantId || !accessKey) {
    throw new Error(`Missing ${input.method} payment configuration`);
  }

  return {
    paymentUrl: `${input.webroot}/credits/payment-pending/${input.paymentId}`,
    transactionId: `${input.method}-${merchantId}-${input.paymentId}`,
  };
}
