import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  HIDE_HISTORY,
  WEBROOT,
} from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";

export const referral = new Elysia()
  .use(userService)
  .get(
    "/referral",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const userData = db.query("SELECT * FROM users WHERE id = ?").as(User).get(user.id);
      if (!userData) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      // Generate referral code from user ID
      const referralCode = Buffer.from(String(user.id)).toString("base64url");
      const referralLink = `${WEBROOT}/register?ref=${referralCode}`;

      // Count referrals
      const referralCount = db
        .query("SELECT COUNT(*) as count FROM users WHERE referred_by = ?")
        .get(user.id) as { count: number } | null;
      const count = referralCount?.count ?? 0;

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Referral" locale={userLocale}>
          <>
            <Header
              webroot={WEBROOT}
              accountRegistration={ACCOUNT_REGISTRATION}
              allowUnauthenticated={ALLOW_UNAUTHENTICATED}
              hideHistory={HIDE_HISTORY}
              loggedIn
              locale={userLocale}
            />
            <main class="w-full flex-1 px-2 sm:px-4">
              <article class="article">
                <h1 class="mb-4 text-xl">{translate("credits.referral", userLocale)}</h1>
                <div class="mb-6 p-4 bg-neutral-800 rounded-sm">
                  <p class="mb-2">{translate("credits.referralLink", userLocale)}:</p>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      value={referralLink}
                      readonly
                      class="flex-1 rounded-sm bg-neutral-700 p-2"
                    />
                    <button
                      type="button"
                      class="btn-secondary"
                      onclick={`navigator.clipboard.writeText('${referralLink}')`}
                    >
                      {translate("credits.copy", userLocale)}
                    </button>
                  </div>
                </div>
                <div class="mb-6 p-4 bg-neutral-800 rounded-sm">
                  <p class="text-lg">{translate("credits.referralReward", userLocale)}</p>
                  <p class="text-neutral-500 mt-2">
                    {translate("credits.referralCount", userLocale)}: {count}
                  </p>
                  <p class="text-green-500 mt-2">
                    {translate("credits.referralEarned", userLocale)}: {count * 100}
                  </p>
                </div>
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  );