import zhCN from "./zh-CN.json";

// 获取嵌套对象的值
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

// 变量插值
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// 英文默认文本
const enDefaults: Record<string, string> = {
  "nav.history": "History",
  "nav.account": "Account",
  "nav.logout": "Logout",
  "nav.login": "Login",
  "nav.register": "Register",
  "nav.credits": "Credits",
  "nav.recharge": "Recharge",
  "nav.checkIn": "Check In",
  "nav.referral": "Referral",
  "nav.admin": "Admin",
  "home.title": "Convert",
  "home.chooseFile": "Choose a file",
  "home.orDrag": "or drag it here",
  "home.searchPlaceholder": "Search for conversions",
  "home.convertButton": "Convert",
  "home.convertTo": "Convert to",
  "history.title": "Results",
  "history.time": "Time",
  "history.files": "Files",
  "history.filesDone": "Files Done",
  "history.status": "Status",
  "history.actions": "Actions",
  "history.deleteSelected": "Delete Selected",
  "history.confirmDelete": "Are you sure you want to delete {count} job(s)? This action cannot be undone.",
  "history.deleteSuccess": "Successfully deleted {count} job(s).{failed}",
  "history.deleteFailed": " Failed to delete {count} job(s).",
  "history.deleteError": "An error occurred while deleting jobs. Please try again.",
  "history.fileDetails": "Detailed File Information:",
  "results.title": "Results",
  "results.delete": "Delete",
  "results.downloadTar": "Tar",
  "results.downloadAll": "All",
  "results.fileName": "Converted File Name",
  "results.status": "Status",
  "results.actions": "Actions",
  "account.title": "Account",
  "account.email": "Email",
  "account.password": "Password",
  "account.newPassword": "Password (leave blank for unchanged)",
  "account.currentPassword": "Current Password",
  "account.update": "Update",
  "auth.setup": "Create your account",
  "auth.welcome": "Welcome to ConvertX!",
  "auth.emailPlaceholder": "Email",
  "auth.passwordPlaceholder": "Password",
  "auth.verifyEmail": "Verify Email",
  "auth.verifyCode": "Verification Code",
  "auth.verifyCodeSent": "A 6-digit code has been sent to {email}",
  "auth.verifyCodeExpired": "Verification code expired",
  "auth.verifyCodeInvalid": "Invalid verification code",
  "auth.resendCode": "Resend Code",
  "auth.referralCode": "Referral Code (optional)",
  "common.poweredBy": "Powered by",
  "common.reportIssues": "Report any issues on",
  "errors.jobNotFound": "Job not found.",
  "errors.invalidJobIds": "Invalid job IDs provided",
  "credits.title": "Credits",
  "credits.balance": "Current Balance",
  "credits.recharge": "Recharge",
  "credits.history": "Transaction History",
  "credits.insufficient": "Insufficient credits. Please recharge.",
  "credits.required": "Required credits: {amount}",
  "credits.charged": "Credits charged: {amount}",
  "credits.refunded": "Credits refunded: {amount}",
  "credits.amount": "Amount",
  "credits.description": "Description",
  "credits.noHistory": "No transaction history",
  "credits.paymentHistory": "Payment History",
  "credits.amountRmb": "Amount (RMB)",
  "credits.creditsGranted": "Credits Granted",
  "credits.checkIn": "Check In",
  "credits.checkInDone": "Already checked in today",
  "credits.checkInTomorrow": "Come back tomorrow for more rewards!",
  "credits.checkInReward": "Check in daily to earn 10 credits!",
  "credits.checkInButton": "Check In Now",
  "credits.checkInSuccess": "Checked in! +10 credits",
  "credits.referral": "Referral",
  "credits.referralLink": "Your referral link",
  "credits.referralReward": "Invite a new user to earn 100 credits",
  "credits.referralCount": "Total referrals",
  "credits.referralEarned": "Credits earned from referrals",
  "credits.copy": "Copy",
  "admin.title": "Admin Dashboard",
  "admin.userCount": "Total Users",
  "admin.conversionCount": "Total Conversions",
  "admin.successCount": "Successful Conversions",
  "admin.failCount": "Failed Conversions",
  "admin.creditConsumed": "Credits Consumed",
  "admin.totalRevenue": "Total Revenue (RMB)",
  "admin.systemLoad": "System Load",
  "admin.memoryUsage": "Memory Usage",
  "admin.cpuLoad": "CPU Load",
  "admin.cpuCount": "CPU Count",
  "admin.recentTransactions": "Recent Transactions",
  "admin.recentUsers": "Recent Users",
  "admin.role": "Role",
  "admin.noUsers": "No users yet",
  "recharge.title": "Recharge",
  "recharge.selectAmount": "Select Amount",
  "recharge.selectMethod": "Select Payment Method",
  "recharge.paymentHistory": "Payment History",
  "recharge.paymentPending": "Payment Pending",
  "recharge.backToRecharge": "Back to Recharge",
};

export function t(key: string, locale: string, vars?: Record<string, string | number>): string {
  let text: string | undefined;

  if (locale === "zh-CN") {
    text = getNestedValue(zhCN, key);
  }

  if (!text) {
    text = enDefaults[key];
  }

  if (!text) {
    return key;
  }

  if (vars) {
    text = interpolate(text, vars);
  }

  return text;
}

export function detectLocale(acceptLanguage: unknown, cookieLocale: unknown): string {
  const acceptLang = typeof acceptLanguage === "string" ? acceptLanguage : null;
  const cookieLang = typeof cookieLocale === "string" ? cookieLocale : null;

  if (cookieLang && (cookieLang === "en" || cookieLang === "zh-CN")) {
    return cookieLang;
  }

  if (acceptLang?.toLowerCase().includes("zh-cn")) {
    return "zh-CN";
  }

  return "en";
}

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
