import db from "../db/db";

export function getUserRole(userId: string | number | undefined): string {
  if (userId === undefined) {
    return "user";
  }

  const user = db.query("SELECT role FROM users WHERE id = ?").get(userId) as {
    role?: string | null;
  } | null;

  return user?.role || "user";
}
