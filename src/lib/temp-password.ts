import { randomBytes } from 'crypto';

/**
 * Generate a strong, URL-safe temporary password.
 * 12 random bytes → 16 base64 chars, stripped to be human-typeable.
 *
 * Phase 6 of megaplan.
 */
export function generateTempPassword(): string {
  // 12 bytes → ~16 base64 chars
  const raw = randomBytes(12).toString('base64');
  // Strip ambiguous chars (+/=) to make it copy-friendly
  return raw.replace(/[+/=]/g, (c) => ({ '+': 'A', '/': 'B', '=': '' }[c] ?? ''));
}
