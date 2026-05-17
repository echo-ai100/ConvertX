const FAILURE_STATUSES = new Set(["Failed, check logs", "File type not supported"]);

export function hasConversionFailures(statuses: string[]): boolean {
  return statuses.some((status) => FAILURE_STATUSES.has(status));
}
