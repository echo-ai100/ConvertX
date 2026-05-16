# 语言支持 (i18n) 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 ConvertX 添加中英文语言支持，用户可在右上角切换语言，中国大陆用户默认显示中文。

**Architecture:** 服务端渲染 + Cookie 存储。通过 Accept-Language 请求头判断默认语言，使用 Cookie 存储用户选择。翻译文本存储在 JSON 文件中，服务端渲染时直接使用正确语言。

**Tech Stack:** TypeScript, Elysia, Bun, JSON 翻译文件

---

## 文件结构

```
src/
├── locales/
│   ├── index.ts          # i18n 辅助函数 (新建)
│   └── zh-CN.json        # 中文翻译文本 (新建)
├── pages/
│   └── locale.tsx        # 语言切换端点 (新建)
├── components/
│   ├── base.tsx          # 添加 lang 属性 (修改)
│   └── header.tsx        # 添加语言切换器 (修改)
└── index.tsx             # 注册 locale 路由 (修改)
```

---

### Task 1: 创建翻译文件和 i18n 辅助函数

**Files:**
- Create: `src/locales/zh-CN.json`
- Create: `src/locales/index.ts`

- [ ] **Step 1: 创建中文翻译文件**

```json
{
  "nav": {
    "history": "历史记录",
    "account": "账户",
    "logout": "退出",
    "login": "登录",
    "register": "注册"
  },
  "home": {
    "title": "转换",
    "dropzone": "<b>选择文件</b>或拖放到此处",
    "searchPlaceholder": "搜索转换格式",
    "convertButton": "转换",
    "convertTo": "转换为"
  },
  "history": {
    "title": "结果",
    "time": "时间",
    "files": "文件",
    "filesDone": "已完成",
    "status": "状态",
    "actions": "操作",
    "deleteSelected": "删除选中",
    "confirmDelete": "确定要删除 {count} 个任务吗？此操作无法撤销。",
    "deleteSuccess": "成功删除 {count} 个任务。{failed}",
    "deleteFailed": "删除 {count} 个任务失败。",
    "deleteError": "删除任务时出错，请重试。",
    "fileDetails": "文件详细信息："
  },
  "results": {
    "title": "结果",
    "delete": "删除",
    "downloadTar": "打包下载",
    "downloadAll": "全部下载",
    "fileName": "文件名",
    "status": "状态",
    "actions": "操作"
  },
  "account": {
    "title": "账户",
    "email": "邮箱",
    "password": "密码",
    "newPassword": "新密码（留空则不修改）",
    "currentPassword": "当前密码",
    "update": "更新"
  },
  "auth": {
    "setup": "创建账户",
    "welcome": "欢迎使用 ConvertX！",
    "emailPlaceholder": "邮箱",
    "passwordPlaceholder": "密码"
  },
  "common": {
    "poweredBy": "由",
    "reportIssues": "在 GitHub 上反馈问题"
  },
  "errors": {
    "jobNotFound": "任务未找到。",
    "invalidJobIds": "提供的任务 ID 无效"
  }
}
```

- [ ] **Step 2: 创建 i18n 辅助函数**

```typescript
// src/locales/index.ts
import zhCN from "./zh-CN.json";

type TranslationKeys = typeof zhCN;

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

// 英文默认文本（当 key 不在 zh-CN.json 中时使用）
const enDefaults: Record<string, string> = {
  "nav.history": "History",
  "nav.account": "Account",
  "nav.logout": "Logout",
  "nav.login": "Login",
  "nav.register": "Register",
  "home.title": "Convert",
  "home.dropzone": "<b>Choose a file</b> or drag it here",
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

  // 回退到英文默认值
  if (!text) {
    text = enDefaults[key];
  }

  // 最终回退到 key 本身
  if (!text) {
    return key;
  }

  // 变量插值
  if (vars) {
    text = interpolate(text, vars);
  }

  return text;
}

export function detectLocale(acceptLanguage: string | null, cookieLocale: string | null): string {
  // 优先使用 Cookie
  if (cookieLocale && (cookieLocale === "en" || cookieLocale === "zh-CN")) {
    return cookieLocale;
  }

  // 根据 Accept-Language 判断
  if (acceptLanguage?.toLowerCase().includes("zh-cn")) {
    return "zh-CN";
  }

  return "en";
}

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
```

- [ ] **Step 3: 提交翻译文件**

```bash
git add src/locales/
git commit -m "feat(i18n): add translation files and i18n helper functions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: 创建语言切换端点

**Files:**
- Create: `src/pages/locale.tsx`

- [ ] **Step 1: 创建语言切换端点**

```typescript
// src/pages/locale.tsx
import { Elysia, t } from "elysia";
import { WEBROOT } from "../helpers/env";
import { SUPPORTED_LOCALES } from "../locales";

export const locale = new Elysia().get(
  "/locale/:lang",
  ({ params, redirect, cookie: { locale: localeCookie }, headers }) => {
    const lang = params.lang;

    // 验证语言参数
    if (!SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])) {
      return redirect(`${WEBROOT}/`, 302);
    }

    // 设置 Cookie
    if (localeCookie) {
      localeCookie.set({
        value: lang,
        httpOnly: false, // 允许 JavaScript 读取
        secure: process.env.HTTP_ALLOWED !== "true",
        maxAge: 365 * 24 * 60 * 60, // 1 年
        sameSite: "strict",
      });
    }

    // 获取来源页面
    const referer = headers.referer || `${WEBROOT}/`;
    return redirect(referer, 302);
  },
  {
    params: t.Object({
      lang: t.String(),
    }),
    cookie: t.Cookie({
      locale: t.Optional(t.String()),
    }),
  },
);
```

- [ ] **Step 2: 在 index.tsx 注册 locale 路由**

修改 `src/index.tsx`，添加 import 和注册：

```typescript
// 在 import 区域添加
import { locale } from "./pages/locale";

// 在 app 链式调用中添加 .use(locale)
// 例如在 .use(healthcheck) 之后
```

- [ ] **Step 3: 提交语言切换端点**

```bash
git add src/pages/locale.tsx src/index.tsx
git commit -m "feat(i18n): add locale switch endpoint

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: 修改 Header 组件添加语言切换器

**Files:**
- Modify: `src/components/header.tsx`

- [ ] **Step 1: 修改 Header 组件**

完整替换 `src/components/header.tsx`：

```typescript
import { t } from "../locales";

export const Header = ({
  loggedIn,
  accountRegistration,
  allowUnauthenticated,
  hideHistory,
  webroot = "",
  locale = "en",
}: {
  loggedIn?: boolean;
  accountRegistration?: boolean;
  allowUnauthenticated?: boolean;
  hideHistory?: boolean;
  webroot?: string;
  locale?: string;
}) => {
  let rightNav: JSX.Element;
  if (loggedIn) {
    rightNav = (
      <ul class="flex gap-4">
        {!hideHistory && (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/history`}
            >
              {t("nav.history", locale)}
            </a>
          </li>
        )}
        {!allowUnauthenticated ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/account`}
            >
              {t("nav.account", locale)}
            </a>
          </li>
        ) : null}
        {!allowUnauthenticated ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/logoff`}
            >
              {t("nav.logout", locale)}
            </a>
          </li>
        ) : null}
        <li class="flex gap-1">
          <a
            class={`
              ${locale === "en" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/en`}
          >
            EN
          </a>
          <span class="text-neutral-600">|</span>
          <a
            class={`
              ${locale === "zh-CN" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/zh-CN`}
          >
            中文
          </a>
        </li>
      </ul>
    );
  } else {
    rightNav = (
      <ul class="flex gap-4">
        <li>
          <a
            class={`
              text-accent-600 transition-all
              hover:text-accent-500 hover:underline
            `}
            href={`${webroot}/login`}
          >
            {t("nav.login", locale)}
          </a>
        </li>
        {accountRegistration ? (
          <li>
            <a
              class={`
                text-accent-600 transition-all
                hover:text-accent-500 hover:underline
              `}
              href={`${webroot}/register`}
            >
              {t("nav.register", locale)}
            </a>
          </li>
        ) : null}
        <li class="flex gap-1">
          <a
            class={`
              ${locale === "en" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/en`}
          >
            EN
          </a>
          <span class="text-neutral-600">|</span>
          <a
            class={`
              ${locale === "zh-CN" ? "text-accent-400 font-bold" : "text-neutral-500"}
              hover:text-accent-500
            `}
            href={`${webroot}/locale/zh-CN`}
          >
            中文
          </a>
        </li>
      </ul>
    );
  }

  return (
    <header class="w-full p-4">
      <nav class={`mx-auto flex max-w-4xl justify-between rounded-sm bg-neutral-900 p-4`}>
        <ul>
          <li>
            <strong>
              <a href={`${webroot}/`}>ConvertX</a>
            </strong>
          </li>
        </ul>
        {rightNav}
      </nav>
    </header>
  );
};
```

- [ ] **Step 2: 提交 Header 修改**

```bash
git add src/components/header.tsx
git commit -m "feat(i18n): add language switcher to header

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: 修改 BaseHtml 组件

**Files:**
- Modify: `src/components/base.tsx`

- [ ] **Step 1: 修改 BaseHtml 组件**

完整替换 `src/components/base.tsx`：

```typescript
import { version } from "../../package.json";
import { t } from "../locales";

export const BaseHtml = ({
  children,
  title = "ConvertX",
  webroot = "",
  locale = "en",
}: {
  children: JSX.Element;
  title?: string;
  webroot?: string;
  locale?: string;
}) => (
  <html lang={locale}>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="webroot" content={webroot} />
      <title safe>{title}</title>
      <link rel="stylesheet" href={`${webroot}/generated.css`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`${webroot}/apple-touch-icon.png`} />
      <link rel="icon" type="image/png" sizes="32x32" href={`${webroot}/favicon-32x32.png`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`${webroot}/favicon-16x16.png`} />
      <link rel="manifest" href={`${webroot}/site.webmanifest`} />
    </head>
    <body class={`flex min-h-screen w-full flex-col bg-neutral-900 text-neutral-200`}>
      {children}
      <footer class="w-full">
        <div class="p-4 text-center text-sm text-neutral-500">
          <span>{t("common.poweredBy", locale)} </span>
          <a
            href="https://github.com/C4illin/ConvertX"
            class={`
              text-neutral-400
              hover:text-accent-500
            `}
          >
            ConvertX{" "}
          </a>
          <span safe>v{version || ""}</span>
        </div>
      </footer>
    </body>
  </html>
);
```

- [ ] **Step 2: 提交 BaseHtml 修改**

```bash
git add src/components/base.tsx
git commit -m "feat(i18n): add lang attribute to BaseHtml

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 修改 user.tsx 页面

**Files:**
- Modify: `src/pages/user.tsx`

- [ ] **Step 1: 修改 user.tsx 添加 i18n 支持**

在文件顶部添加 import：
```typescript
import { t, detectLocale } from "../locales";
```

修改 `userService` 添加 locale 相关类型和 resolve：
```typescript
// 在 .model 中添加 locale Cookie
.model({
  // ... 现有 models
  localeCookie: t.Cookie({
    locale: t.Optional(t.String()),
  }),
})

// 添加 derive 获取 locale
.derive(({ headers, cookie: { locale } }) => ({
  locale: detectLocale(headers["accept-language"], locale?.value),
}))
```

修改所有页面渲染部分：
- 将硬编码文本替换为 `t("key", locale)` 调用
- 在 Header 组件中传入 `locale` prop
- 在 BaseHtml 组件中传入 `locale` prop

关键文本替换：
- "Welcome to ConvertX!" → `{t("auth.welcome", locale)}`
- "Create your account" → `{t("auth.setup", locale)}`
- "Email" → `{t("account.email", locale)}`
- "Password" → `{t("account.password", locale)}`
- "Login" → `{t("nav.login", locale)}`
- "Register" → `{t("nav.register", locale)}`
- "Account" → `{t("nav.account", locale)}`
- "Password (leave blank for unchanged)" → `{t("account.newPassword", locale)}`
- "Current Password" → `{t("account.currentPassword", locale)}`
- "Update" → `{t("account.update", locale)}`

- [ ] **Step 2: 提交 user.tsx 修改**

```bash
git add src/pages/user.tsx
git commit -m "feat(i18n): add i18n support to user pages

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: 修改 root.tsx 页面

**Files:**
- Modify: `src/pages/root.tsx`

- [ ] **Step 1: 修改 root.tsx 添加 i18n 支持**

在文件顶部添加 import：
```typescript
import { t, detectLocale } from "../locales";
```

添加 derive 获取 locale：
```typescript
.derive(({ headers, cookie: { locale } }) => ({
  locale: detectLocale(headers["accept-language"], locale?.value),
}))
```

修改页面渲染部分：
- "Convert" → `{t("home.title", locale)}`
- "<b>Choose a file</b> or drag it here" → `{t("home.dropzone", locale)}` (使用 innerHTML 或拆分)
- "Search for conversions" → `{t("home.searchPlaceholder", locale)}`
- "Convert to" → `{t("home.convertTo", locale)}`
- "Convert" (按钮) → `{t("home.convertButton", locale)}`

在 Header 和 BaseHtml 中传入 `locale` prop。

- [ ] **Step 2: 提交 root.tsx 修改**

```bash
git add src/pages/root.tsx
git commit -m "feat(i18n): add i18n support to home page

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: 修改 history.tsx 页面

**Files:**
- Modify: `src/pages/history.tsx`

- [ ] **Step 1: 修改 history.tsx 添加 i18n 支持**

在文件顶部添加 import：
```typescript
import { t, detectLocale } from "../locales";
```

添加 derive 获取 locale。

修改页面渲染部分：
- "Results" → `{t("history.title", locale)}`
- "Delete Selected" → `{t("history.deleteSelected", locale)}`
- "Time" → `{t("history.time", locale)}`
- "Files" → `{t("history.files", locale)}`
- "Files Done" → `{t("history.filesDone", locale)}`
- "Status" → `{t("history.status", locale)}`
- "Actions" → `{t("history.actions", locale)}`
- "Detailed File Information:" → `{t("history.fileDetails", locale)}`

修改内联脚本中的文本（使用模板字符串注入翻译）：
```typescript
const confirmMsg = t("history.confirmDelete", locale, { count: "${jobIds.length}" });
const successMsg = t("history.deleteSuccess", locale, { count: "${result.deleted}" });
// ... 其他消息
```

在 Header 和 BaseHtml 中传入 `locale` prop。

- [ ] **Step 2: 提交 history.tsx 修改**

```bash
git add src/pages/history.tsx
git commit -m "feat(i18n): add i18n support to history page

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: 修改 results.tsx 页面

**Files:**
- Modify: `src/pages/results.tsx`

- [ ] **Step 1: 修改 results.tsx 添加 i18n 支持**

在文件顶部添加 import：
```typescript
import { t, detectLocale } from "../locales";
```

添加 derive 获取 locale。

修改页面渲染部分：
- "Results" → `{t("results.title", locale)}`
- "Delete" → `{t("results.delete", locale)}`
- "Tar" → `{t("results.downloadTar", locale)}`
- "All" → `{t("results.downloadAll", locale)}`
- "Converted File Name" → `{t("results.fileName", locale)}`
- "Status" → `{t("results.status", locale)}`
- "Actions" → `{t("results.actions", locale)}`

在 Header 和 BaseHtml 中传入 `locale` prop。

- [ ] **Step 2: 提交 results.tsx 修改**

```bash
git add src/pages/results.tsx
git commit -m "feat(i18n): add i18n support to results page

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: 修改其他页面

**Files:**
- Modify: `src/pages/chooseConverter.tsx`
- Modify: `src/pages/deleteJob.tsx`

- [ ] **Step 1: 修改 chooseConverter.tsx**

添加 import 和 locale derive。
修改 "Convert to" → `{t("home.convertTo", locale)}`。

- [ ] **Step 2: 修改 deleteJob.tsx**

添加 import 和 locale derive。
修改错误消息：
- "Invalid job IDs provided" → `{t("errors.invalidJobIds", locale)}`

- [ ] **Step 3: 提交修改**

```bash
git add src/pages/chooseConverter.tsx src/pages/deleteJob.tsx
git commit -m "feat(i18n): add i18n support to remaining pages

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: 测试和验证

- [ ] **Step 1: 运行开发服务器测试**

```bash
bun run dev
```

手动测试：
1. 访问首页，检查默认语言
2. 点击语言切换器，验证切换功能
3. 检查各页面文本是否正确翻译
4. 检查 Cookie 是否正确设置

- [ ] **Step 2: 运行 lint 检查**

```bash
bun run lint
```

修复任何 lint 错误。

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat(i18n): complete i18n implementation with all pages

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
