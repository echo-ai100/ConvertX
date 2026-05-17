import { mkdir } from "node:fs/promises";
import { Elysia, t } from "elysia";
import sanitize from "sanitize-filename";
import { outputDir, uploadsDir } from "..";
import { handleConvert } from "../converters/main";
import db from "../db/db";
import { Jobs } from "../db/types";
import { WEBROOT, BILLING_ENABLED } from "../helpers/env";
import { normalizeFiletype } from "../helpers/normalizeFiletype";
import { userService } from "./user";
import { calculateJobCredits, deductCredits, refundCredits } from "../helpers/billing";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import { ACCOUNT_REGISTRATION, ALLOW_UNAUTHENTICATED, HIDE_HISTORY } from "../helpers/env";
import { t as translate, detectLocale } from "../locales";
import { getUserRole } from "../helpers/userRole";

export const convert = new Elysia().use(userService).post(
  "/convert",
  async ({ body, redirect, jwt, cookie: { auth, jobId }, headers }) => {
    if (!auth?.value) {
      return redirect(`${WEBROOT}/login`, 302);
    }

    const user = await jwt.verify(auth.value);
    if (!user) {
      return redirect(`${WEBROOT}/login`, 302);
    }

    if (!jobId?.value) {
      return redirect(`${WEBROOT}/`, 302);
    }

    const existingJob = db
      .query("SELECT * FROM jobs WHERE id = ? AND user_id = ?")
      .as(Jobs)
      .get(jobId.value, user.id);

    if (!existingJob) {
      return redirect(`${WEBROOT}/`, 302);
    }

    const userUploadsDir = `${uploadsDir}${user.id}/${jobId.value}/`;
    const userOutputDir = `${outputDir}${user.id}/${jobId.value}/`;

    // create the output directory
    try {
      await mkdir(userOutputDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create the output directory: ${userOutputDir}.`, error);
    }

    const convertTo = normalizeFiletype(body.convert_to.split(",")[0] ?? "");
    const converterName = body.convert_to.split(",")[1];

    if (
      !converterName ||
      convertTo.includes("/") ||
      convertTo.includes("\\") ||
      convertTo.includes("..")
    ) {
      return redirect(`${WEBROOT}/`, 302);
    }

    const fileNames = JSON.parse(body.file_names) as string[];

    for (let i = 0; i < fileNames.length; i++) {
      fileNames[i] = sanitize(fileNames[i] || "");
    }

    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return redirect(`${WEBROOT}/`, 302);
    }

    // Billing check
    if (BILLING_ENABLED) {
      const requiredCredits = calculateJobCredits(fileNames, userUploadsDir);
      const success = deductCredits(user.id, requiredCredits, Number(jobId.value));
      if (!success) {
        const userLocale = detectLocale(headers["accept-language"], undefined);
        return (
          <BaseHtml webroot={WEBROOT} title="ConvertX | Insufficient Credits" locale={userLocale}>
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
                  <h1 class="mb-4 text-xl">{translate("credits.insufficient", userLocale)}</h1>
                  <p class="mb-4">
                    {translate("credits.required", userLocale, { amount: String(requiredCredits) })}
                  </p>
                  <a href={`${WEBROOT}/credits`} class="btn-primary inline-block">
                    {translate("credits.recharge", userLocale)}
                  </a>
                </article>
              </main>
            </>
          </BaseHtml>
        );
      }
      db.query("UPDATE jobs SET credits_charged = ? WHERE id = ?").run(
        requiredCredits,
        jobId.value,
      );
    }

    db.query("UPDATE jobs SET num_files = ?1, status = 'pending' WHERE id = ?2").run(
      fileNames.length,
      jobId.value,
    );

    // Start the conversion process in the background
    handleConvert(fileNames, userUploadsDir, userOutputDir, convertTo, converterName, jobId)
      .then(() => {
        // All conversions are done, update the job status to 'completed'
        if (jobId.value) {
          db.query("UPDATE jobs SET status = 'completed' WHERE id = ?1").run(jobId.value);
        }

        // Delete all uploaded files in userUploadsDir
        // rmSync(userUploadsDir, { recursive: true, force: true });
      })
      .catch((error) => {
        console.error("Error in conversion process:", error);
        // Refund credits on failure
        if (BILLING_ENABLED && jobId.value) {
          const job = db
            .query("SELECT credits_charged FROM jobs WHERE id = ?")
            .get(jobId.value) as {
            credits_charged: number;
          } | null;
          if (job && job.credits_charged > 0) {
            refundCredits(user.id, job.credits_charged, Number(jobId.value));
          }
        }
        if (jobId.value) {
          db.query("UPDATE jobs SET status = 'failed' WHERE id = ?").run(jobId.value);
        }
      });

    // Redirect the client immediately
    return redirect(`${WEBROOT}/results/${jobId.value}`, 302);
  },
  {
    body: t.Object({
      convert_to: t.String(),
      file_names: t.String(),
    }),
    auth: true,
  },
);
