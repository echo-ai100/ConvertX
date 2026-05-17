import { mkdirSync } from "node:fs";
import { Database } from "bun:sqlite";

mkdirSync("./data", { recursive: true });
const db = new Database("./data/mydb.sqlite", { create: true });

if (!db.query("SELECT * FROM sqlite_master WHERE type='table'").get()) {
  db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL,
	password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS file_names (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  output_file_name TEXT NOT NULL,
  status TEXT DEFAULT 'not started',
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);
CREATE TABLE IF NOT EXISTS jobs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	date_created TEXT NOT NULL,
  status TEXT DEFAULT 'not started',
  num_files INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
PRAGMA user_version = 1;`);
}

let dbVersion = (db.query("PRAGMA user_version").get() as { user_version?: number }).user_version;
if (dbVersion === 0) {
  db.exec("ALTER TABLE file_names ADD COLUMN status TEXT DEFAULT 'not started';");
  db.exec("PRAGMA user_version = 1;");
  console.log("Updated database to version 1.");
  dbVersion = 1;
}

if (dbVersion === 1) {
  db.exec(`
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN referred_by INTEGER DEFAULT NULL;
    ALTER TABLE users ADD COLUMN last_check_in TEXT DEFAULT NULL;
    ALTER TABLE jobs ADD COLUMN credits_charged INTEGER DEFAULT 0;
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id INTEGER DEFAULT NULL,
      description TEXT DEFAULT NULL,
      date_created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount_rmb REAL NOT NULL,
      credits_granted INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      transaction_id TEXT DEFAULT NULL,
      date_created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      date_created TEXT NOT NULL
    );
    PRAGMA user_version = 2;
  `);
  console.log("Updated database to version 2.");
  dbVersion = 2;
}

if (dbVersion === 2) {
  db.exec(`
    ALTER TABLE email_verification_codes ADD COLUMN attempts INTEGER DEFAULT 0;
    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY NOT NULL,
      password_hash TEXT NOT NULL,
      referral_code TEXT DEFAULT NULL,
      expires_at TEXT NOT NULL,
      date_created TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_file_names_job_id ON file_names(job_id);
    PRAGMA user_version = 3;
  `);
  console.log("Updated database to version 3.");
  dbVersion = 3;
}

// enable WAL mode
db.exec("PRAGMA journal_mode = WAL;");

export default db;
