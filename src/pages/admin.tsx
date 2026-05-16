import os from "node:os";
import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { CreditTransaction, User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  HIDE_HISTORY,
  WEBROOT,
  ADMIN_EMAILS,
} from "../helpers/env";
import { userService } from "./user";
import { t as translate, detectLocale } from "../locales";

export const admin = new Elysia()
  .use(userService)
  .get(
    "/admin",
    async ({ user, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      if (!user) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const userData = db.query("SELECT email, role FROM users WHERE id = ?").get(user.id) as {
        email: string;
        role: string;
      } | null;

      if (!userData || (userData.role !== "admin" && !ADMIN_EMAILS.includes(userData.email.toLowerCase()))) {
        return redirect(`${WEBROOT}/`, 302);
      }

      // Ensure admin role is set
      if (ADMIN_EMAILS.includes(userData.email.toLowerCase()) && userData.role !== "admin") {
        db.query("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
      }

      // Aggregate statistics
      const userCount = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number } | null;
      const jobCount = db.query("SELECT COUNT(*) as count FROM jobs").get() as { count: number } | null;
      const completedJobs = db.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as {
        count: number;
      } | null;
      const failedJobs = db.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'failed'").get() as {
        count: number;
      } | null;
      const creditConsumed = db.query(
        "SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM credit_transactions WHERE type = 'conversion'"
      ).get() as { total: number } | null;
      const totalRevenue = db.query(
        "SELECT COALESCE(SUM(amount_rmb), 0) as total FROM payments WHERE payment_status = 'completed'"
      ).get() as { total: number } | null;

      // Recent transactions
      const recentTransactions = db
        .query("SELECT * FROM credit_transactions ORDER BY date_created DESC LIMIT 50")
        .as(CreditTransaction)
        .all();

      // Recent users
      const recentUsers = db
        .query("SELECT id, email, credits, role FROM users ORDER BY id DESC LIMIT 20")
        .all() as { id: number; email: string; credits: number; role: string }[];

      // System metrics
      const memoryUsage = process.memoryUsage();
      const cpuLoad = os.loadavg();
      const cpuCount = os.cpus().length;

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Admin" locale={userLocale}>
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
                <h1 class="mb-4 text-xl">{translate("admin.title", userLocale)}</h1>

                <section class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.userCount", userLocale)}</p>
                    <p class="text-2xl font-bold">{String(userCount?.count ?? 0)}</p>
                  </div>
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.conversionCount", userLocale)}</p>
                    <p class="text-2xl font-bold">{String(jobCount?.count ?? 0)}</p>
                  </div>
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.successCount", userLocale)}</p>
                    <p class="text-2xl font-bold text-green-500">{String(completedJobs?.count ?? 0)}</p>
                  </div>
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.failCount", userLocale)}</p>
                    <p class="text-2xl font-bold text-red-500">{String(failedJobs?.count ?? 0)}</p>
                  </div>
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.creditConsumed", userLocale)}</p>
                    <p class="text-2xl font-bold">{String(creditConsumed?.total ?? 0)}</p>
                  </div>
                  <div class="p-4 bg-neutral-800 rounded-sm">
                    <p class="text-neutral-500">{translate("admin.totalRevenue", userLocale)}</p>
                    <p class="text-2xl font-bold">{String(totalRevenue?.total ?? 0)}元</p>
                  </div>
                </section>

                <section class="mb-6">
                  <h2 class="mb-2 text-lg">{translate("admin.systemLoad", userLocale)}</h2>
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div class="p-4 bg-neutral-800 rounded-sm">
                      <p class="text-neutral-500">{translate("admin.memoryUsage", userLocale)}</p>
                      <p class="text-lg">{Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB</p>
                    </div>
                    <div class="p-4 bg-neutral-800 rounded-sm">
                      <p class="text-neutral-500">{translate("admin.cpuLoad", userLocale)}</p>
                      <p class="text-lg">{(cpuLoad[0] ?? 0).toFixed(2)} / {(cpuLoad[1] ?? 0).toFixed(2)} / {(cpuLoad[2] ?? 0).toFixed(2)}</p>
                    </div>
                    <div class="p-4 bg-neutral-800 rounded-sm">
                      <p class="text-neutral-500">{translate("admin.cpuCount", userLocale)}</p>
                      <p class="text-lg">{cpuCount}</p>
                    </div>
                  </div>
                </section>

                <section class="mb-6">
                  <h2 class="mb-2 text-lg">{translate("admin.recentTransactions", userLocale)}</h2>
                  {recentTransactions.length > 0 ? (
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-sm">
                        <thead>
                          <tr class="border-b border-neutral-700">
                            <th class="p-2">{translate("history.time", userLocale)}</th>
                            <th class="p-2">User ID</th>
                            <th class="p-2">{translate("results.status", userLocale)}</th>
                            <th class="p-2">{translate("credits.amount", userLocale)}</th>
                            <th class="p-2">{translate("credits.description", userLocale)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions.map((tx) => (
                            <tr class="border-b border-neutral-800">
                              <td class="p-2">{new Date(tx.date_created).toLocaleString()}</td>
                              <td class="p-2">{tx.user_id}</td>
                              <td class="p-2">{tx.type}</td>
                              <td class={`p-2 ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                              </td>
                              <td class="p-2">{tx.description ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p class="text-neutral-500">{translate("credits.noHistory", userLocale)}</p>
                  )}
                </section>

                <section>
                  <h2 class="mb-2 text-lg">{translate("admin.recentUsers", userLocale)}</h2>
                  {recentUsers.length > 0 ? (
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-sm">
                        <thead>
                          <tr class="border-b border-neutral-700">
                            <th class="p-2">ID</th>
                            <th class="p-2">{translate("account.email", userLocale)}</th>
                            <th class="p-2">{translate("credits.title", userLocale)}</th>
                            <th class="p-2">{translate("admin.role", userLocale)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map((u) => (
                            <tr class="border-b border-neutral-800">
                              <td class="p-2">{String(u.id)}</td>
                              <td class="p-2">{u.email}</td>
                              <td class="p-2">{String(u.credits)}</td>
                              <td class="p-2">{u.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p class="text-neutral-500">{translate("admin.noUsers", userLocale)}</p>
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