export function utcDateKey(date: string | Date): string {
  return new Date(date).toISOString().split("T")[0] ?? "";
}

export function isSameUtcDay(left: string | Date, right: string | Date): boolean {
  return utcDateKey(left) === utcDateKey(right);
}
