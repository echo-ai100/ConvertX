export function buildReferralLink(
  headers: Record<string, string | undefined>,
  webroot: string,
  referralCode: string,
): string {
  const forwardedProto = headers["x-forwarded-proto"]?.split(",")[0]?.trim();
  const forwardedHost = headers["x-forwarded-host"]?.split(",")[0]?.trim();
  const host = forwardedHost || headers.host;
  const path = `${webroot}/register?ref=${encodeURIComponent(referralCode)}`;

  if (!host) {
    return path;
  }

  return `${forwardedProto || "http"}://${host}${path}`;
}
