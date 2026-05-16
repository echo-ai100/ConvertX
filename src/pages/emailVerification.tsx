import { Elysia, t } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { User } from "../db/types";
import {
  ACCOUNT_REGISTRATION,
  ALLOW_UNAUTHENTICATED,
  HIDE_HISTORY,
  INITIAL_CREDITS,
  WEBROOT,
  ADMIN_EMAILS,
} from "../helpers/env";
import { userService, FIRST_RUN } from "./user";
import { t as translate, detectLocale } from "../locales";
import { sendVerificationCode, generateVerificationCode } from "../helpers/email";
import { addCredits } from "../helpers/billing";

export const emailVerification = new Elysia()
  .use(userService)
  .get(
    "/verify-email",
    async ({ query, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      const email = query.email;

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Verify Email" locale={userLocale}>
          <>
            <Header
              webroot={WEBROOT}
              accountRegistration={ACCOUNT_REGISTRATION}
              allowUnauthenticated={ALLOW_UNAUTHENTICATED}
              hideHistory={HIDE_HISTORY}
              locale={userLocale}
            />
            <main class="w-full flex-1 px-2 sm:px-4">
              <article class="article">
                <h1 class="mb-4 text-xl">{translate("auth.verifyEmail", userLocale)}</h1>
                <p class="mb-4">{translate("auth.verifyCodeSent", userLocale, { email })}</p>
                <form method="post" action={`${WEBROOT}/verify-email`} class="flex flex-col gap-4">
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="password" value={query.password ?? ""} />
                  <input type="hidden" name="referral_code" value={query.referral_code ?? ""} />
                  <label class="flex flex-col gap-1">
                    {translate("auth.verifyCode", userLocale)}
                    <input
                      type="text"
                      name="code"
                      class="rounded-sm bg-neutral-800 p-3 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxlength="6"
                      required
                    />
                  </label>
                  <input type="submit" value={translate("nav.register", userLocale)} class="btn-primary" />
                </form>
                <form method="post" action={`${WEBROOT}/verify-email/send`} class="mt-4">
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="password" value={query.password ?? ""} />
                  <input type="hidden" name="referral_code" value={query.referral_code ?? ""} />
                  <input type="submit" value={translate("auth.resendCode", userLocale)} class="btn-secondary" />
                </form>
              </article>
            </main>
          </>
        </BaseHtml>
      );
    },
    {
      query: t.Object({
        email: t.String(),
        password: t.Optional(t.String()),
        referral_code: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/verify-email/send",
    async ({ body, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      const { email, password, referral_code } = body;

      // Check if email already registered
      const existingUser = db.query("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return redirect(`${WEBROOT}/login?error=exists`, 302);
      }

      // Generate and store verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Delete any previous codes for this email
      db.query("DELETE FROM email_verification_codes WHERE email = ?").run(email);

      db.query(
        "INSERT INTO email_verification_codes (email, code, expires_at, verified, date_created) VALUES (?, ?, ?, ?, ?)"
      ).run(email, code, expiresAt, 0, new Date().toISOString());

      // Send email
      const sent = await sendVerificationCode(email, code, userLocale);
      if (!sent) {
        console.warn("Failed to send verification email, code:", code);
      }

      // Redirect to verification page
      const redirectUrl = `${WEBROOT}/verify-email?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password ?? "")}&referral_code=${encodeURIComponent(referral_code ?? "")}`;
      return redirect(redirectUrl, 302);
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.Optional(t.String()),
        referral_code: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/verify-email",
    async ({ body, redirect, jwt, cookie: { auth }, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      const { email, password, code, referral_code } = body;

      // Check if email already registered
      const existingUser = db.query("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return redirect(`${WEBROOT}/login?error=exists`, 302);
      }

      // Verify code
      const verificationRecord = db
        .query("SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND verified = 0")
        .get(email, code) as { expires_at: string } | null;

      if (!verificationRecord) {
        return redirect(`${WEBROOT}/verify-email?email=${encodeURIComponent(email)}&error=invalid`, 302);
      }

      // Check if expired
      if (new Date(verificationRecord.expires_at) < new Date()) {
        return redirect(`${WEBROOT}/verify-email?email=${encodeURIComponent(email)}&error=expired`, 302);
      }

      // Mark code as verified
      db.query("UPDATE email_verification_codes SET verified = 1 WHERE email = ? AND code = ?").run(email, code);

      // Create user
      const savedPassword = await Bun.password.hash(password || "");
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      // Handle referral
      let referredBy: number | null = null;
      if (referral_code) {
        try {
          const referrerId = Buffer.from(referral_code, "base64url").toString();
          const referrer = db.query("SELECT id FROM users WHERE id = ?").get(Number(referrerId));
          if (referrer) {
            referredBy = Number(referrerId);
          }
        } catch {
          // Invalid referral code, ignore
        }
      }

      db.query(
        "INSERT INTO users (email, password, credits, role, email_verified, referred_by, last_check_in) VALUES (?, ?, ?, ?, ?, ?, NULL)"
      ).run(email, savedPassword, INITIAL_CREDITS, isAdmin ? "admin" : "user", 1, referredBy);

      const user = db.query("SELECT * FROM users WHERE email = ?").as(User).get(email);

      if (!user) {
        return redirect(`${WEBROOT}/login?error=failed`, 302);
      }

      // Give referral reward to referrer
      if (referredBy) {
        addCredits(referredBy, 100, "referral", `Referral reward for user ${user.id}`, user.id);
      }

      // Sign JWT and set cookie
      const accessToken = await jwt.sign({ id: String(user.id) });

      if (!auth) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      auth.set({
        value: accessToken,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
      });

      return redirect(`${WEBROOT}/`, 302);
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        code: t.String(),
        referral_code: t.Optional(t.String()),
      }),
    },
  );