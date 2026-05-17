import { Elysia, t } from "elysia";
import { BaseHtml } from "../components/base";
import { Header } from "../components/header";
import db from "../db/db";
import { Filename, Jobs } from "../db/types";
import { ALLOW_UNAUTHENTICATED, WEBROOT } from "../helpers/env";
import { t as translate, detectLocale } from "../locales";
import { DownloadIcon } from "../icons/download";
import { DeleteIcon } from "../icons/delete";
import { EyeIcon } from "../icons/eye";
import { userService } from "./user";
import { getUserRole } from "../helpers/userRole";

function ResultsArticle({
  job,
  files,
  outputPath,
  locale,
}: {
  job: Jobs;
  files: Filename[];
  outputPath: string;
  locale: string;
}) {
  return (
    <article class="article">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl">{translate("results.title", locale)}</h1>
        <div class="flex flex-row gap-4">
          <form method="post" action={`${WEBROOT}/delete/${job.id}`}>
            <button
              style={files.length !== job.num_files ? "pointer-events: none;" : ""}
              class="flex btn-secondary flex-row gap-2 text-contrast"
              type="submit"
              {...(files.length !== job.num_files ? { disabled: true, "aria-busy": "true" } : {})}
            >
              <DeleteIcon /> <p>{translate("results.delete", locale)}</p>
            </button>
          </form>
          <a
            style={files.length !== job.num_files ? "pointer-events: none;" : ""}
            href={`${WEBROOT}/archive/${job.id}`}
            download={`converted_files_${job.id}.tar`}
            class="flex btn-primary flex-row gap-2 text-contrast"
            {...(files.length !== job.num_files ? { disabled: true, "aria-busy": "true" } : "")}
          >
            <DownloadIcon /> <p>{translate("results.downloadTar", locale)}</p>
          </a>
          <button class="flex btn-primary flex-row gap-2 text-contrast" onclick="downloadAll()">
            <DownloadIcon /> <p>{translate("results.downloadAll", locale)}</p>
          </button>
        </div>
      </div>
      <progress
        max={job.num_files}
        {...(files.length === job.num_files ? { value: files.length } : "")}
        class={`
          mb-4 inline-block h-2 w-full appearance-none overflow-hidden rounded-full border-0
          bg-neutral-700 bg-none text-accent-500 accent-accent-500
          [&::-moz-progress-bar]:bg-accent-500
          [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:[background:none]
          [&[value]::-webkit-progress-value]:bg-accent-500
          [&[value]::-webkit-progress-value]:transition-[inline-size]
        `}
      />
      <table
        class={`
          w-full table-auto rounded-sm bg-neutral-900 text-left
          [&_td]:p-4
          [&_tr]:rounded-sm [&_tr]:border-b [&_tr]:border-neutral-800
        `}
      >
        <thead>
          <tr>
            <th
              class={`
                p-2
                sm:px-4
              `}
            >
              {translate("results.fileName", locale)}
            </th>
            <th
              class={`
                p-2
                sm:px-4
              `}
            >
              {translate("results.status", locale)}
            </th>
            <th
              class={`
                p-2
                sm:px-4
              `}
            >
              {translate("results.actions", locale)}
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr>
              <td safe class="max-w-[20vw] truncate">
                {file.output_file_name}
              </td>
              <td safe>{file.status}</td>
              <td class="flex flex-row gap-4">
                <a
                  class={`
                    text-accent-500 underline
                    hover:text-accent-400
                  `}
                  href={`${WEBROOT}/download/${outputPath}${file.output_file_name}`}
                >
                  <EyeIcon />
                </a>
                <a
                  class={`
                    text-accent-500 underline
                    hover:text-accent-400
                  `}
                  href={`${WEBROOT}/download/${outputPath}${file.output_file_name}`}
                  download={file.output_file_name}
                >
                  <DownloadIcon />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export const results = new Elysia()
  .use(userService)
  .get(
    "/results/:jobId",
    async ({ params, set, cookie: { job_id, locale }, user, headers }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);

      if (job_id?.value) {
        // Clear the job_id cookie since we are viewing the results
        job_id.remove();
      }

      const job = db
        .query("SELECT * FROM jobs WHERE user_id = ? AND id = ?")
        .as(Jobs)
        .get(user.id, params.jobId);

      if (!job) {
        set.status = 404;
        return {
          message: translate("errors.jobNotFound", userLocale),
        };
      }

      const outputPath = `${user.id}/${params.jobId}/`;

      const files = db
        .query("SELECT * FROM file_names WHERE job_id = ?")
        .as(Filename)
        .all(params.jobId);

      return (
        <BaseHtml webroot={WEBROOT} title="ConvertX | Result" locale={userLocale}>
          <>
            <Header
              webroot={WEBROOT}
              allowUnauthenticated={ALLOW_UNAUTHENTICATED}
              loggedIn
              locale={userLocale}
              userRole={getUserRole(user.id)}
            />
            <main
              class={`
                w-full flex-1 px-2
                sm:px-4
              `}
            >
              <ResultsArticle job={job} files={files} outputPath={outputPath} locale={userLocale} />
            </main>
            <script src={`${WEBROOT}/results.js`} defer />
          </>
        </BaseHtml>
      );
    },
    {
      auth: true,
      cookie: t.Cookie({
        locale: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/progress/:jobId",
    async ({ set, params, cookie: { job_id, locale }, user, headers }) => {
      const userLocale = detectLocale(headers["accept-language"], locale?.value);

      if (job_id?.value) {
        // Clear the job_id cookie since we are viewing the results
        job_id.remove();
      }

      const job = db
        .query("SELECT * FROM jobs WHERE user_id = ? AND id = ?")
        .as(Jobs)
        .get(user.id, params.jobId);

      if (!job) {
        set.status = 404;
        return {
          message: translate("errors.jobNotFound", userLocale),
        };
      }

      const outputPath = `${user.id}/${params.jobId}/`;

      const files = db
        .query("SELECT * FROM file_names WHERE job_id = ?")
        .as(Filename)
        .all(params.jobId);

      return <ResultsArticle job={job} files={files} outputPath={outputPath} locale={userLocale} />;
    },
    { auth: true },
  );
