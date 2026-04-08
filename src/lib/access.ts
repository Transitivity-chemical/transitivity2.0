import type { Plan, UserRole } from '@prisma/client';

export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN';
}

export function canAccessAdmin(role?: string | null): boolean {
  return isAdminRole(role);
}

const PLAN_RANK: Record<Plan, number> = {
  STUDENT: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

export function getPlanRank(plan: Plan | null | undefined): number {
  if (!plan) return 0;
  return PLAN_RANK[plan];
}

export function isPlanAtLeast(
  plan: Plan | null | undefined,
  minimum: Plan,
): boolean {
  return getPlanRank(plan) >= PLAN_RANK[minimum];
}

export type { Plan, UserRole };
