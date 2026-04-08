import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/access';

/**
 * API route handler wrappers for auth/admin gating.
 *
 * Pattern: server-side enforcement at every API boundary.
 * Reference: docs/research-external.md §1 (gate at four layers)
 *           AGENTS.md (asyncWrapper / shouldBeAuthorized pattern)
 */

export type AuthedHandler<TParams = unknown> = (
  req: NextRequest,
  ctx: { params: Promise<TParams> },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: { user: { id: string; role: string; plan: string | null; [key: string]: any } },
) => Promise<Response> | Response;

export function withAuth<TParams = unknown>(handler: AuthedHandler<TParams>) {
  return async (req: NextRequest, ctx: { params: Promise<TParams> }) => {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handler(req, ctx, session as any);
  };
}

export function withAdmin<TParams = unknown>(handler: AuthedHandler<TParams>) {
  return async (req: NextRequest, ctx: { params: Promise<TParams> }) => {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!isAdminRole((session.user as any).role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handler(req, ctx, session as any);
  };
}
