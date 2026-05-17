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
  HTTP_ALLOWED,
} from "../helpers/env";
import { userService, FIRST_RUN } from "./user";
import { t as translate, detectLocale } from "../locales";
import { sendVerificationCode, generateVerificationCode } from "../helpers/email";
import { addCredits } from "../helpers/billing";
import {
  buildVerificationRedirectUrl,
  isValidPasswordForRegistration,
} from "../helpers/registration";

type PendingRegistration = {
  password_hash: string;
  referral_code: string | null;
  expires_at: string;
};

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
                  <input
                    type="submit"
                    value={translate("nav.register", userLocale)}
                    class="btn-primary"
                  />
                </form>
                <form method="post" action={`${WEBROOT}/verify-email/send`} class="mt-4">
                  <input type="hidden" name="email" value={email} />
                  <input
                    type="submit"
                    value={translate("auth.resendCode", userLocale)}
                    class="btn-secondary"
                  />
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
        referral_code: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/verify-email/send",
    async ({ body, redirect, headers, cookie: { locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      const { email, password, referral_code } = body;

      if (FIRST_RUN) {
        return redirect(`${WEBROOT}/setup`, 302);
      }

      if (!ACCOUNT_REGISTRATION) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      const existingPending = db
        .query("SELECT * FROM pending_registrations WHERE email = ?")
        .get(email) as { password_hash: string; referral_code: string | null } | null;
      if (!existingPending && !isValidPasswordForRegistration(password)) {
        return redirect(`${WEBROOT}/register?error=invalid-password`, 302);
      }

      // Check if email already registered
      const existingUser = db.query("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return redirect(`${WEBROOT}/login?error=exists`, 302);
      }

      const recentCode = db
        .query(
          "SELECT date_created FROM email_verification_codes WHERE email = ? AND expires_at > ?",
        )
        .get(email, new Date().toISOString()) as { date_created: string } | null;
      if (recentCode && Date.now() - new Date(recentCode.date_created).getTime() < 60 * 1000) {
        return redirect(buildVerificationRedirectUrl(WEBROOT, email, password, referral_code), 302);
      }

      // Generate and store verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const passwordHash =
        existingPending?.password_hash ?? (await Bun.password.hash(password ?? ""));
      const pendingReferralCode = referral_code ?? existingPending?.referral_code ?? null;

      // Delete any previous codes for this email
      db.query("DELETE FROM email_verification_codes WHERE email = ?").run(email);
      db.query("DELETE FROM pending_registrations WHERE email = ?").run(email);

      db.query(
        "INSERT INTO email_verification_codes (email, code, expires_at, verified, attempts, date_created) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(email, code, expiresAt, 0, 0, new Date().toISOString());
      db.query(
        "INSERT INTO pending_registrations (email, password_hash, referral_code, expires_at, date_created) VALUES (?, ?, ?, ?, ?)",
      ).run(email, passwordHash, pendingReferralCode, expiresAt, new Date().toISOString());

      // Send email
      const sent = await sendVerificationCode(email, code, userLocale);
      if (!sent) {
        console.warn("Failed to send verification email, code:", code);
      }

      // Redirect to verification page
      const redirectUrl = buildVerificationRedirectUrl(
        WEBROOT,
        email,
        password,
        pendingReferralCode ?? undefined,
      );
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
    async ({ body, redirect, jwt, headers, cookie: { auth, locale } }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);
      const { email, code } = body;

      if (FIRST_RUN) {
        return redirect(`${WEBROOT}/setup`, 302);
      }

      if (!ACCOUNT_REGISTRATION) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      // Check if email already registered
      const existingUser = db.query("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return redirect(`${WEBROOT}/login?error=exists`, 302);
      }

      // Verify code
      const verificationRecord = db
        .query(
          "SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND verified = 0",
        )
        .get(email, code) as { expires_at: string; attempts: number } | null;
      const pendingRegistration = db
        .query("SELECT * FROM pending_registrations WHERE email = ?")
        .get(email) as PendingRegistration | null;

      if (!verificationRecord || !pendingRegistration) {
        const attempts = db
          .query(
            "UPDATE email_verification_codes SET attempts = attempts + 1 WHERE email = ? AND verified = 0",
          )
          .run(email);
        if (attempts.changes > 0) {
          const current = db
            .query("SELECT attempts FROM email_verification_codes WHERE email = ? AND verified = 0")
            .get(email) as { attempts: number } | null;
          if ((current?.attempts ?? 0) >= 5) {
            db.query("DELETE FROM pending_registrations WHERE email = ?").run(email);
            db.query("DELETE FROM email_verification_codes WHERE email = ?").run(email);
          }
        }
        return redirect(
          `${WEBROOT}/verify-email?email=${encodeURIComponent(email)}&error=invalid`,
          302,
        );
      }

      // Check if expired
      if (
        new Date(verificationRecord.expires_at) < new Date() ||
        new Date(pendingRegistration.expires_at) < new Date()
      ) {
        return redirect(
          `${WEBROOT}/verify-email?email=${encodeURIComponent(email)}&error=expired`,
          302,
        );
      }

      // Mark code as verified
      db.query("UPDATE email_verification_codes SET verified = 1 WHERE email = ? AND code = ?").run(
        email,
        code,
      );

      // Create user
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      // Handle referral
      let referredBy: number | null = null;
      if (pendingRegistration.referral_code) {
        try {
          const referrerId = Buffer.from(pendingRegistration.referral_code, "base64url").toString();
          const referrer = db.query("SELECT id FROM users WHERE id = ?").get(Number(referrerId));
          if (referrer) {
            referredBy = Number(referrerId);
          }
        } catch {
          // Invalid referral code, ignore
        }
      }

      db.query(
        "INSERT INTO users (email, password, credits, role, email_verified, referred_by, last_check_in) VALUES (?, ?, ?, ?, ?, ?, NULL)",
      ).run(
        email,
        pendingRegistration.password_hash,
        INITIAL_CREDITS,
        isAdmin ? "admin" : "user",
        1,
        referredBy,
      );

      const user = db.query("SELECT * FROM users WHERE email = ?").as(User).get(email);

      if (!user) {
        return redirect(`${WEBROOT}/login?error=failed`, 302);
      }

      // Give referral reward to referrer
      if (referredBy) {
        addCredits(referredBy, 100, "referral", `Referral reward for user ${user.id}`, user.id);
      }
      db.query("DELETE FROM pending_registrations WHERE email = ?").run(email);
      db.query("DELETE FROM email_verification_codes WHERE email = ?").run(email);

      // Sign JWT and set cookie
      const accessToken = await jwt.sign({ id: String(user.id) });

      if (!auth) {
        return redirect(`${WEBROOT}/login`, 302);
      }

      auth.set({
        value: accessToken,
        httpOnly: true,
        secure: !HTTP_ALLOWED,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
      });

      return redirect(`${WEBROOT}/`, 302);
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
      }),
    },
  );
