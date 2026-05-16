import { Elysia, t } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { CreditTransaction, Payment, User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  HIDE_HISTORY,
  WEBROOT,
  BILLING_ENABLED,
} from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";
import { getUserCredits, addCredits } from "../helpers/billing";

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
        .query("SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY date_created DESC LIMIT 20")
        .as(CreditTransaction)
        .all(user.id);

      const payments = db
        .query("SELECT * FROM payments WHERE user_id = ? ORDER BY date_created DESC LIMIT 10")
        .as(Payment)
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
            />
            <main class="w-full flex-1 px-2 sm:px-4">
              <article class="article">
                <h1 class="mb-4 text-xl">{translate("credits.title", userLocale)}</h1>
                <div class="mb-6 p-4 bg-neutral-800 rounded-sm">
                  <p class="text-2xl font-bold">
                    {translate("credits.balance", userLocale)}: {creditsBalance}
                  </p>
                </div>

                {BILLING_ENABLED && (
                  <section class="mb-6">
                    <h2 class="mb-2 text-lg">{translate("credits.recharge", userLocale)}</h2>
                    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <form method="post" action={`${WEBROOT}/credits/recharge`}>
                        <input type="hidden" name="amount_rmb" value="10" />
                        <input type="hidden" name="credits" value="100" />
                        <input type="hidden" name="method" value="wechat" />
                        <button type="submit" class="btn-secondary w-full">
                          10元 = 100积分
                        </button>
                      </form>
                      <form method="post" action={`${WEBROOT}/credits/recharge`}>
                        <input type="hidden" name="amount_rmb" value="50" />
                        <input type="hidden" name="credits" value="500" />
                        <input type="hidden" name="method" value="wechat" />
                        <button type="submit" class="btn-secondary w-full">
                          50元 = 500积分
                        </button>
                      </form>
                      <form method="post" action={`${WEBROOT}/credits/recharge`}>
                        <input type="hidden" name="amount_rmb" value="100" />
                        <input type="hidden" name="credits" value="1000" />
                        <input type="hidden" name="method" value="wechat" />
                        <button type="submit" class="btn-secondary w-full">
                          100元 = 1000积分
                        </button>
                      </form>
                      <form method="post" action={`${WEBROOT}/credits/recharge`}>
                        <input type="hidden" name="amount_rmb" value="500" />
                        <input type="hidden" name="credits" value="5000" />
                        <input type="hidden" name="method" value="wechat" />
                        <button type="submit" class="btn-secondary w-full">
                          500元 = 5000积分
                        </button>
                      </form>
                    </div>
                  </section>
                )}

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

                {payments.length > 0 && (
                  <section>
                    <h2 class="mb-2 text-lg">{translate("credits.paymentHistory", userLocale)}</h2>
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-neutral-700">
                          <th class="p-2">{translate("history.time", userLocale)}</th>
                          <th class="p-2">{translate("credits.amountRmb", userLocale)}</th>
                          <th class="p-2">{translate("credits.creditsGranted", userLocale)}</th>
                          <th class="p-2">{translate("results.status", userLocale)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr class="border-b border-neutral-800">
                            <td class="p-2">{new Date(p.date_created).toLocaleString()}</td>
                            <td class="p-2">{p.amount_rmb}元</td>
                            <td class="p-2">{p.credits_granted}</td>
                            <td class="p-2">{p.payment_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
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
    "/credits/recharge",
    async ({ user, body, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const { amount_rmb, credits, method } = body;

      // Create payment record
      db.query(
        "INSERT INTO payments (user_id, amount_rmb, credits_granted, payment_method, payment_status, transaction_id, date_created) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(user.id, amount_rmb, credits, method, "pending", null, new Date().toISOString());

      const payment = db
        .query("SELECT id FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 1")
        .as(Payment)
        .get(user.id);

      if (!payment) {
        return redirect(`${WEBROOT}/credits?error=failed`, 302);
      }

      // For simulation, directly complete the payment
      // In production, this would redirect to payment gateway
      db.query("UPDATE payments SET payment_status = ? WHERE id = ?").run("completed", payment.id);
      addCredits(user.id, credits, "recharge", `Recharge ${amount_rmb} RMB`, payment.id);

      return redirect(`${WEBROOT}/credits`, 302);
    },
    {
      body: t.Object({
        amount_rmb: t.Number(),
        credits: t.Number(),
        method: t.String(),
      }),
      auth: true,
    },
  );