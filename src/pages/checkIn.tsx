import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { User } from "../db/types";
import { ACCOUNT_REGISTRATION, ALLOW_UNAUTHENTICATED, HIDE_HISTORY, WEBROOT } from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";
import { isSameUtcDay, utcDateKey } from "../helpers/checkIn";
import { recordCreditTransaction } from "../helpers/billing";

export const checkIn = new Elysia()
  .use(userService)
  .get(
    "/check-in",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const userData = db.query("SELECT * FROM users WHERE id = ?").as(User).get(user.id);
      if (!userData) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      // Check if already checked in today
      const now = new Date();
      const alreadyCheckedIn = userData.last_check_in
        ? isSameUtcDay(userData.last_check_in, now)
        : false;

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Check In" locale={userLocale}>
          <>
            <Header
              webroot={WEBROOT}
              accountRegistration={ACCOUNT_REGISTRATION}
              allowUnauthenticated={ALLOW_UNAUTHENTICATED}
              hideHistory={HIDE_HISTORY}
              loggedIn
              locale={userLocale}
              userRole={userData.role}
            />
            <main class="w-full flex-1 px-2 sm:px-4">
              <article class="article">
                <h1 class="mb-4 text-xl">{translate("credits.checkIn", userLocale)}</h1>
                {alreadyCheckedIn ? (
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-lg">{translate("credits.checkInDone", userLocale)}</p>
                    <p class="text-neutral-500 mt-2">
                      {translate("credits.checkInTomorrow", userLocale)}
                    </p>
                  </div>
                ) : (
                  <form method="post" action={`${WEBROOT}/check-in`}>
                    <p class="mb-4">{translate("credits.checkInReward", userLocale)}</p>
                    <button type="submit" class="btn-primary">
                      {translate("credits.checkInButton", userLocale)}
                    </button>
                  </form>
                )}
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  )
  .post(
    "/check-in",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const userData = db.query("SELECT * FROM users WHERE id = ?").as(User).get(user.id);
      if (!userData) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      // Check if already checked in today
      const now = new Date();
      const alreadyCheckedIn = userData.last_check_in
        ? isSameUtcDay(userData.last_check_in, now)
        : false;

      if (alreadyCheckedIn) {
        return redirect(`${WEBROOT}/check-in`, 302);
      }

      // Perform check-in
      const nowIso = now.toISOString();
      const result = db
        .query(
          "UPDATE users SET credits = credits + 10, last_check_in = ? WHERE id = ? AND (last_check_in IS NULL OR substr(last_check_in, 1, 10) != ?)",
        )
        .run(nowIso, user.id, utcDateKey(now));
      if (result.changes === 0) {
        return redirect(`${WEBROOT}/check-in`, 302);
      }
      recordCreditTransaction(user.id, 10, "check_in", "Daily check-in reward", null);

      return redirect(`${WEBROOT}/check-in?success=true`, 302);
    },
    { auth: true },
  );
