export class Filename {
  id!: number;
  job_id!: number;
  file_name!: string;
  output_file_name!: string;
  status!: string;
}

export class User {
  id!: number;
  email!: string;
  password!: string;
  credits!: number;
  role!: string;
  email_verified!: number;
  referred_by!: number | null;
  last_check_in!: string | null;
}

export class Jobs {
  finished_files!: number;
  id!: number;
  user_id!: number;
  date_created!: string;
  status!: string;
  num_files!: number;
  credits_charged!: number;
  files_detailed!: Filename[];
}

export class CreditTransaction {
  id!: number;
  user_id!: number;
  amount!: number;
  type!: string;
  reference_id!: number | null;
  description!: string | null;
  date_created!: string;
}

export class Payment {
  id!: number;
  user_id!: number;
  amount_rmb!: number;
  credits_granted!: number;
  payment_method!: string;
  payment_status!: string;
  transaction_id!: string | null;
  date_created!: string;
}

export class EmailVerificationCode {
  id!: number;
  email!: string;
  code!: string;
  expires_at!: string;
  verified!: number;
  date_created!: string;
}