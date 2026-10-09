// src/lib/maintenance.ts — Centralized Maintenance Mode & Whitelist Controller

// Set to `true` to lock down the website from the public (only whitelisted emails can access)
// Set to `false` to open the website publicly
export const IS_MAINTENANCE_LOCKDOWN = true;

// List of emails authorized to bypass maintenance lockdown
export const WHITELISTED_EMAILS: string[] = [
  "gunelmemmedzade2006@gmail.com",
  "bella.orudzhova@mail.ru",
  "nandazhafran@gmail.com",
  "aryayuda.work@gmail.com",
];

/**
 * Checks if an email address is authorized in the whitelist
 */
export function isEmailWhitelisted(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return WHITELISTED_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
}
