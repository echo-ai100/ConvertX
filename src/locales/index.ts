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
  "common.poweredBy": "Powered by",
  "common.reportIssues": "Report any issues on",
  "errors.jobNotFound": "Job not found.",
  "errors.invalidJobIds": "Invalid job IDs provided",
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
