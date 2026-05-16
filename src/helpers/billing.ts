import db from "../db/db";
import { getFormatCategory, CATEGORY_COEFFICIENTS } from "./formatCategory";
import { normalizeFiletype } from "./normalizeFiletype";

export function calculateFileCredits(
  fileSizeBytes: number,
  normalizedFileType: string,
): number {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const category = getFormatCategory(normalizedFileType);
  const coefficient = CATEGORY_COEFFICIENTS[category];
  return Math.ceil(fileSizeMB * 10 * coefficient);
}

export function calculateJobCredits(
  fileNames: string[],
  userUploadsDir: string,
): number {
  let total = 0;
  for (const fileName of fileNames) {
    const filePath = `${userUploadsDir}${fileName}`;
    const file = Bun.file(filePath);
    const fileSizeBytes = file.size;
    const ext = fileName.includes(".") ? (fileName.split(".").pop() ?? "") : "";
    const normalizedType = normalizeFiletype(ext);
    total += calculateFileCredits(fileSizeBytes, normalizedType);
  }
  return total;
}

export function deductCredits(
  userId: string | number,
  amount: number,
  jobId: number | null,
): boolean {
  const user = db
    .query("SELECT credits FROM users WHERE id = ?")
    .get(userId) as { credits: number } | null;
  if (!user || user.credits < amount) return false;

  db.query("UPDATE users SET credits = credits - ? WHERE id = ?").run(
    amount,
    userId,
  );
  db.query(
    "INSERT INTO credit_transactions (user_id, amount, type, reference_id, description, date_created) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    userId,
    -amount,
    "conversion",
    jobId,
    `Conversion job #${jobId}`,
    new Date().toISOString(),
  );
  return true;
}

export function refundCredits(
  userId: string | number,
  amount: number,
  jobId: number | null,
): void {
  db.query("UPDATE users SET credits = credits + ? WHERE id = ?").run(
    amount,
    userId,
  );
  db.query(
    "INSERT INTO credit_transactions (user_id, amount, type, reference_id, description, date_created) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(userId, amount, "refund", jobId, `Refund for job #${jobId}`, new Date().toISOString());
}

export function addCredits(
  userId: string | number,
  amount: number,
  type: string,
  description: string,
  referenceId: number | null = null,
): void {
  db.query("UPDATE users SET credits = credits + ? WHERE id = ?").run(
    amount,
    userId,
  );
  db.query(
    "INSERT INTO credit_transactions (user_id, amount, type, reference_id, description, date_created) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(userId, amount, type, referenceId, description, new Date().toISOString());
}

export function getUserCredits(userId: string | number): number {
  const user = db
    .query("SELECT credits FROM users WHERE id = ?")
    .get(userId) as { credits: number } | null;
  return user?.credits ?? 0;
}