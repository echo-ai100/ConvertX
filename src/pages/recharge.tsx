import { Elysia, t } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { Payment, User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  BILLING_ENABLED,
  HIDE_HISTORY,
  PAYMENT_PROVIDER,
  WEBROOT,
} from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";
import { addCredits } from "../helpers/billing";
import { getUserRole } from "../helpers/userRole";
import {
  canCreateRechargePayment,
  createPaymentRequest,
  getPaymentConfig,
  getRechargePackage,
  isPaymentMethod,
  RECHARGE_PACKAGES,
} from "../helpers/recharge";

export const recharge = new Elysia()
  .use(userService)
  .get(
    "/recharge",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      if (!canCreateRechargePayment(BILLING_ENABLED)) {
        return redirect(`${WEBROOT}/credits`, 302);
      }

      const userData = db.query("SELECT * FROM users WHERE id = ?").as(User).get(user.id);
      if (!userData) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const payments = db
        .query("SELECT * FROM payments WHERE user_id = ? ORDER BY date_created DESC LIMIT 10")
        .as(Payment)
        .all(user.id);

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Recharge" locale={userLocale}>
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
                <h1 class="mb-6 text-xl">{translate("recharge.title", userLocale)}</h1>

                <section class="mb-8">
                  <h2 class="mb-3 text-lg">{translate("recharge.selectAmount", userLocale)}</h2>
                  <div class="flex flex-wrap gap-3">
                    {RECHARGE_PACKAGES.map((pkg) => (
                      <button
                        type="button"
                        class="recharge-amount-btn flex flex-col items-center justify-center rounded-lg border-2 border-neutral-700 bg-neutral-800 px-6 py-4 transition-all hover:border-neutral-500 hover:bg-neutral-700"
                        data-package-id={pkg.id}
                        data-amount={pkg.amountRmb}
                        data-credits={pkg.credits}
                      >
                        <span class="text-2xl font-bold">{pkg.amountRmb}元</span>
                        <span class="mt-1 text-sm text-neutral-400">{pkg.credits}积分</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section class="mb-8">
                  <h2 class="mb-3 text-lg">{translate("recharge.selectMethod", userLocale)}</h2>
                  <div class="flex gap-4">
                    <form method="post" action={`${WEBROOT}/recharge/pay`} class="recharge-method-form">
                      <input type="hidden" name="package_id" class="method-package-id" value="" />
                      <input type="hidden" name="payment_method" value="alipay" />
                      <button
                        type="submit"
                        class="recharge-method-btn flex items-center justify-center rounded-lg border-2 border-neutral-700 bg-neutral-800 px-8 py-4 text-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-800 hover:border-blue-500 hover:bg-blue-900/30"
                        disabled
                      >
                        <svg class="mr-2 size-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.422 15.358c-3.83-1.153-6.055-2.003-7.168-2.565.6-1.095.955-2.33.955-3.642 0-1.878-.855-3.563-2.21-4.71C13.593 3.522 14.25 2.28 14.25.75h-4.5c0 1.53.657 2.772 1.251 3.69C9.646 5.588 8.79 7.273 8.79 9.15c0 1.312.355 2.547.955 3.642-1.113.562-3.338 1.412-7.168 2.565C1.077 15.632.75 16.14.75 16.71c0 .765.622 1.387 1.387 1.387h19.726c.765 0 1.387-.622 1.387-1.387 0-.57-.327-1.078-.828-1.352z" />
                        </svg>
                        支付宝
                      </button>
                    </form>
                    <form method="post" action={`${WEBROOT}/recharge/pay`} class="recharge-method-form">
                      <input type="hidden" name="package_id" class="method-package-id" value="" />
                      <input type="hidden" name="payment_method" value="wechat" />
                      <button
                        type="submit"
                        class="recharge-method-btn flex items-center justify-center rounded-lg border-2 border-neutral-700 bg-neutral-800 px-8 py-4 text-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-800 hover:border-green-500 hover:bg-green-900/30"
                        disabled
                      >
                        <svg class="mr-2 size-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.9-1.103a.61.61 0 01.486-.067c1.084.297 2.248.46 3.452.46.279 0 .554-.012.828-.032a4.29 4.29 0 01-.172-1.204c0-3.71 3.456-6.716 7.714-6.716.296 0 .587.018.875.048C17.532 4.273 13.482 2.188 8.691 2.188zm7.714 6.716c-3.736 0-6.76 2.543-6.76 5.68 0 3.136 3.024 5.68 6.76 5.68.826 0 1.62-.135 2.362-.378a.46.46 0 01.366.05l1.283.744a.246.246 0 00.126.041.222.222 0 00.219-.223c0-.054-.022-.108-.036-.16l-.263-.997a.445.445 0 01.161-.502c1.385-1.018 2.29-2.537 2.29-4.235 0-3.137-3.024-5.68-6.76-5.68z" />
                        </svg>
                        微信支付
                      </button>
                    </form>
                  </div>
                </section>

                {payments.length > 0 && (
                  <section>
                    <h2 class="mb-3 text-lg">{translate("recharge.paymentHistory", userLocale)}</h2>
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
            <script>
              {`
                document.addEventListener('DOMContentLoaded', () => {
                  const amountBtns = document.querySelectorAll('.recharge-amount-btn');
                  const methodBtns = document.querySelectorAll('.recharge-method-btn');
                  const methodInputs = document.querySelectorAll('.method-package-id');

                  amountBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                      amountBtns.forEach(b => {
                        b.classList.remove('border-accent-500', 'bg-accent-900/30');
                        b.classList.add('border-neutral-700', 'bg-neutral-800');
                      });
                      this.classList.remove('border-neutral-700', 'bg-neutral-800');
                      this.classList.add('border-accent-500', 'bg-accent-900/30');

                      const pkgId = this.dataset.packageId;
                      methodInputs.forEach(input => input.value = pkgId);
                      methodBtns.forEach(btn => btn.disabled = false);
                    });
                  });
                });
              `}
            </script>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  )
  .post(
    "/recharge/pay",
    async ({ user, body, redirect }) => {
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      if (!canCreateRechargePayment(BILLING_ENABLED)) {
        return redirect(`${WEBROOT}/credits?error=billing-disabled`, 302);
      }

      const pkg = getRechargePackage(body.package_id);
      if (!pkg) {
        return redirect(`${WEBROOT}/recharge?error=invalid-package`, 302);
      }

      if (!isPaymentMethod(body.payment_method)) {
        return redirect(`${WEBROOT}/recharge?error=invalid-payment-method`, 302);
      }

      db.query(
        "INSERT INTO payments (user_id, amount_rmb, credits_granted, payment_method, payment_status, transaction_id, date_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(
        user.id,
        pkg.amountRmb,
        pkg.credits,
        body.payment_method,
        "pending",
        null,
        new Date().toISOString(),
      );

      const payment = db
        .query("SELECT id FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 1")
        .as(Payment)
        .get(user.id);

      if (!payment) {
        return redirect(`${WEBROOT}/recharge?error=failed`, 302);
      }

      try {
        const paymentRequest = createPaymentRequest({
          config: getPaymentConfig(PAYMENT_PROVIDER),
          method: body.payment_method,
          paymentId: payment.id,
          amountRmb: pkg.amountRmb,
          credits: pkg.credits,
          webroot: WEBROOT,
        });

        db.query("UPDATE payments SET transaction_id = ? WHERE id = ?").run(
          paymentRequest.transactionId,
          payment.id,
        );

        return redirect(paymentRequest.paymentUrl, 302);
      } catch (error) {
        console.error("Failed to create payment request", error);
        return redirect(`${WEBROOT}/recharge?error=payment-config`, 302);
      }
    },
    {
      body: t.Object({
        package_id: t.String(),
        payment_method: t.String(),
      }),
      auth: true,
    },
  )
  .get(
    "/recharge/payment-pending/:paymentId",
    async ({ user, params, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const payment = db
        .query("SELECT * FROM payments WHERE id = ? AND user_id = ?")
        .as(Payment)
        .get(params.paymentId, user.id);
      if (!payment) {
        return redirect(`${WEBROOT}/recharge?error=payment-not-found`, 302);
      }

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Payment Pending" locale={userLocale}>
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
                <h1 class="mb-4 text-xl">{translate("recharge.paymentPending", userLocale)}</h1>
                <p class="mb-4">
                  {payment.amount_rmb}元 = {payment.credits_granted}积分
                </p>
                <a href={`${WEBROOT}/recharge`} class="btn-secondary inline-block">
                  {translate("recharge.backToRecharge", userLocale)}
                </a>
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  )
  .get(
    "/recharge/mock-pay/:paymentId",
    async ({ user, params, redirect, headers, query, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const payment = db
        .query("SELECT * FROM payments WHERE id = ? AND user_id = ?")
        .as(Payment)
        .get(params.paymentId, user.id);
      if (!payment) {
        return redirect(`${WEBROOT}/recharge?error=payment-not-found`, 302);
      }

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Mock Pay" locale={userLocale}>
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
                <h1 class="mb-4 text-xl">
                  Mock {query.method === "alipay" ? "Alipay" : "WeChat"} Pay
                </h1>
                <p class="mb-4">
                  {payment.amount_rmb}元 = {payment.credits_granted}积分
                </p>
                <form method="post" action={`${WEBROOT}/recharge/mock-pay/${payment.id}`}>
                  <button type="submit" class="btn-primary">
                    Simulate payment success
                  </button>
                </form>
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    { auth: true },
  )
  .post(
    "/recharge/mock-pay/:paymentId",
    async ({ user, params, redirect }) => {
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const payment = db
        .query("SELECT * FROM payments WHERE id = ? AND user_id = ?")
        .as(Payment)
        .get(params.paymentId, user.id);
      if (!payment) {
        return redirect(`${WEBROOT}/recharge?error=payment-not-found`, 302);
      }

      const result = db
        .query(
          "UPDATE payments SET payment_status = 'completed' WHERE id = ? AND user_id = ? AND payment_status = 'pending'",
        )
        .run(payment.id, user.id);
      if (result.changes > 0) {
        addCredits(
          user.id,
          payment.credits_granted,
          "recharge",
          `Recharge ${payment.amount_rmb} RMB via ${payment.payment_method}`,
          payment.id,
        );
      }

      return redirect(`${WEBROOT}/recharge?payment=completed`, 302);
    },
    { auth: true },
  );