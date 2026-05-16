# 语言支持设计文档

## 概述

为 ConvertX 添加中英文语言支持，用户可在右上角切换语言，中国大陆用户默认显示中文，其他地区默认显示英文。

## 需求

- 语言切换器位于右上角导航栏
- 使用 Cookie 存储用户语言偏好（有效期 1 年）
- 通过 `Accept-Language` 请求头判断默认语言（包含 `zh-CN` 则默认中文）
- 翻译文本存储在单文件 JSON 中

## 文件结构

```
src/
├── locales/
│   ├── index.ts          # i18n 辅助函数
│   └── zh-CN.json        # 中文翻译文本
├── pages/
│   └── locale.tsx        # 语言切换端点
└── ...                   # 其他页面修改使用 i18n
```

## 核心逻辑

### 语言检测流程

```
1. 检查 Cookie 中是否有 locale
   └─ 有 → 使用 Cookie 值
   └─ 无 → 检查 Accept-Language 请求头
           └─ 包含 zh-CN → 默认中文
           └─ 其他 → 默认英文
```

### Cookie 策略

- 名称：`locale`
- 值：`en` 或 `zh-CN`
- 有效期：1 年
- 属性：`httpOnly: false`（允许 JavaScript 读取）

### i18n 辅助函数

```typescript
// src/locales/index.ts
export function t(key: string, locale: string): string;
export function detectLocale(acceptLanguage: string | null, cookieLocale: string | null): string;
```

使用点分隔路径访问翻译文本，如 `t("nav.history", "zh-CN")`。

### 语言切换端点

- `GET /locale/:lang` - 设置语言 Cookie 并重定向回来源页面
- 通过 `Referer` 头获取来源页面

## 翻译文件结构

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
    "dropzone": "选择文件或拖放到此处",
    "searchPlaceholder": "搜索转换格式",
    "convertButton": "转换"
  },
  "history": {
    "title": "结果",
    "time": "时间",
    "files": "文件",
    "filesDone": "已完成",
    "status": "状态",
    "actions": "操作",
    "deleteSelected": "删除选中",
    "confirmDelete": "确定要删除 {count} 个任务吗？此操作无法撤销。"
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
    "createAccount": "创建账户",
    "welcome": "欢迎使用 ConvertX！"
  },
  "common": {
    "poweredBy": "由",
    "reportIssues": "在 GitHub 上反馈问题"
  }
}
```

## UI 修改

### Header 语言切换器

```
┌─────────────────────────────────────────────────┐
│  ConvertX          History  Account  [EN | 中文] │
└─────────────────────────────────────────────────┘
```

- 显示为简单的 `[EN | 中文]` 链接
- 当前语言高亮显示
- 点击切换并刷新页面

### 需要修改的页面

1. `header.tsx` - 导航链接文本 + 语言切换器
2. `base.tsx` - `<html lang={locale}>` + 页脚文本
3. `root.tsx` - 首页文本
4. `history.tsx` - 历史记录页面文本 + 内联脚本文本
5. `results.tsx` - 结果页面文本
6. `user.tsx` - 登录/注册/账户页面文本
7. `chooseConverter.tsx` - 转换器选择页面文本
8. `deleteFile.tsx` / `deleteJob.tsx` - 删除确认页面文本
9. `download.tsx` - 下载页面文本

## 实现步骤

1. 创建 `src/locales/zh-CN.json` 翻译文件
2. 创建 `src/locales/index.ts` i18n 辅助函数
3. 创建 `src/pages/locale.tsx` 语言切换端点
4. 修改 `src/components/header.tsx` 添加语言切换器
5. 修改 `src/components/base.tsx` 添加 `lang` 属性
6. 修改各页面使用 i18n 函数
7. 在 `src/index.tsx` 注册 locale 路由

## 注意事项

- 保持现有 `LANGUAGE` 环境变量用于日期格式化，与界面语言分离
- JavaScript 内联脚本中的文本（如确认对话框）也需要翻译
- 翻译文本中的变量插值使用 `{variable}` 格式
