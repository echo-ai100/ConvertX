export const ACCOUNT_REGISTRATION =
  process.env.ACCOUNT_REGISTRATION?.toLowerCase() === "true" || false;

export const HTTP_ALLOWED = process.env.HTTP_ALLOWED?.toLowerCase() === "true" || false;

export const ALLOW_UNAUTHENTICATED =
  process.env.ALLOW_UNAUTHENTICATED?.toLowerCase() === "true" || false;

export const AUTO_DELETE_EVERY_N_HOURS = process.env.AUTO_DELETE_EVERY_N_HOURS
  ? Number(process.env.AUTO_DELETE_EVERY_N_HOURS)
  : 24;

export const HIDE_HISTORY = process.env.HIDE_HISTORY?.toLowerCase() === "true" || false;

export const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
export const SMTP_HOST = process.env.SMTP_HOST ?? "";
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
export const SMTP_USER = process.env.SMTP_USER ?? "";
export const SMTP_PASS = process.env.SMTP_PASS ?? "";
export const SMTP_FROM = process.env.SMTP_FROM ?? "ConvertX <noreply@convertx.com>";
export const INITIAL_CREDITS = Number(process.env.INITIAL_CREDITS) || 0;
export const BILLING_ENABLED = process.env.BILLING_ENABLED?.toLowerCase() === "true" || false;
export const PAYMENT_PROVIDER =
  process.env.PAYMENT_PROVIDER?.toLowerCase() === "live" ? "live" : "mock";
export const ALIPAY_MERCHANT_ID = process.env.ALIPAY_MERCHANT_ID ?? "";
export const ALIPAY_ACCESS_KEY = process.env.ALIPAY_ACCESS_KEY ?? "";
export const WECHAT_MERCHANT_ID = process.env.WECHAT_MERCHANT_ID ?? "";
export const WECHAT_ACCESS_KEY = process.env.WECHAT_ACCESS_KEY ?? "";

export const WEBROOT = process.env.WEBROOT ?? "";

export const LANGUAGE = process.env.LANGUAGE?.toLowerCase() || "en";

export const MAX_CONVERT_PROCESS =
  process.env.MAX_CONVERT_PROCESS && Number(process.env.MAX_CONVERT_PROCESS) > 0
    ? Number(process.env.MAX_CONVERT_PROCESS)
    : 0;

export const UNAUTHENTICATED_USER_SHARING =
  process.env.UNAUTHENTICATED_USER_SHARING?.toLowerCase() === "true" || false;

export const TIMEZONE = process.env.TZ || undefined;
