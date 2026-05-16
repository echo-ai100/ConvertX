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
        httpOnly: false,
        secure: process.env.HTTP_ALLOWED !== "true",
        maxAge: 365 * 24 * 60 * 60,
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