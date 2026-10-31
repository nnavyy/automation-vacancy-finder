/** Paid access is granted by the operator, never by client settings or JWT claims. */
export function hasCompanyIntelAccess(userId: string): boolean {
  return (process.env.COMPANY_INTEL_USER_IDS ?? "")
    .split(",")
    .some((id) => id.trim() === userId && userId.length > 0);
}
