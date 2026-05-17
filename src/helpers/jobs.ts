export type DraftJobLike = {
  num_files?: number | null;
  status?: string | null;
};

export const COUNTABLE_CONVERSION_JOB_SQL = "num_files > 0";

export function isReusableDraftJob(job: DraftJobLike | null | undefined): boolean {
  return job?.num_files === 0 && (job.status === null || job.status === "not started");
}

export function shouldCountJobInAdminStats(job: DraftJobLike | null | undefined): boolean {
  return (job?.num_files ?? 0) > 0;
}
