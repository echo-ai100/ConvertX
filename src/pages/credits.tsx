import { Elysia, t } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { CreditTransaction, User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  HIDE_HISTORY,
  WEBROOT,
} from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";
import { getUserCredits } from "../helpers/billing";
import { getUserRole } from "../helpers/userRole";

export const credits = new Elysia()
  .use(userService)
  .get(
    "/credits",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const userData = db.query("SELECT * FROM users WHERE id = ?").as(User).get(user.id);
      if (!userData) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const creditsBalance = getUserCredits(user.id);
      const transactions = db
        .query(
          "SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY date_created DESC LIMIT 20",
        )
        .as(CreditTransaction)
        .all(user.id);

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Credits" locale={userLocale}>
          <>
            <Header
              webroot={WEBROOT}
              accountRegistration={ACCOUNT_REGISTRATION}
              allowUnauthenticated={ALLOW_UNAUTHENTICATED}
              hideHistory={HIDE_HISTORY}
              loggedIn
              locale={userLocale}
              userRole={getUserRole(user.id)}
            />
            <main class="w-full flex-1 px-2 sm:px-4">
              <article class="article">
                <h1 class="mb-4 text-xl">{translate("credits.title", userLocale)}</h1>
                <div class="mb-6 p-4 bg-neutral-800 rounded-sm">
                  <p class="text-2xl font-bold">
                    {translate("credits.balance", userLocale)}: {creditsBalance}
                  </p>
                </div>

                <section class="mb-6">
                  <h2 class="mb-2 text-lg">{translate("credits.history", userLocale)}</h2>
                  {transactions.length > 0 ? (
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-neutral-700">
                          <th class="p-2">{translate("history.time", userLocale)}</th>
                          <th class="p-2">{translate("results.status", userLocale)}</th>
                          <th class="p-2">{translate("credits.amount", userLocale)}</th>
                          <th class="p-2">{translate("credits.description", userLocale)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr class="border-b border-neutral-800">
                            <td class="p-2">{new Date(tx.date_created).toLocaleString()}</td>
                            <td class="p-2">{tx.type}</td>
                            <td class={`p-2 ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                            </td>
                            <td class="p-2">{tx.description ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p class="text-neutral-500">{translate("credits.noHistory", userLocale)}</p>
                  )}
                </section>
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  );