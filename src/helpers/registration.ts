export function isValidPasswordForRegistration(password: string | undefined): boolean {
  return typeof password === "string" && password.trim().length > 0;
}

export function buildVerificationRedirectUrl(
  webroot: string,
  email: string,
  _password: string | undefined,
  referralCode: string | undefined,
): string {
  const params = new URLSearchParams({ email });
  if (referralCode) {
    params.set("referral_code", referralCode);
  }
  return `${webroot}/verify-email?${params.toString()}`;
}
