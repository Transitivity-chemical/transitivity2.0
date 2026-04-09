import { prisma } from '@/lib/prisma';
import type { InstitutionalDomain } from '@prisma/client';

/**
 * Email domain validator for self-registration.
 *
 * Reference: docs/research-external.md §4 (DB-stored allowlist pattern)
 *           docs/transitivity-overhaul-plan.md Phase 4
 */

export function extractDomain(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  const at = email.lastIndexOf('@');
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

export type DomainValidationResult = {
  allowed: boolean;
  domain: InstitutionalDomain | null;
};

export async function validateEmailDomain(
  email: string,
): Promise<DomainValidationResult> {
  const domain = extractDomain(email);
  if (!domain) return { allowed: false, domain: null };

  const record = await prisma.institutionalDomain.findUnique({
    where: { domain },
  });

  return {
    allowed: Boolean(record && record.isVerified),
    domain: record,
  };
}
