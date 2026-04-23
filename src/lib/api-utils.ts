import { NextResponse } from 'next/server';
import { auth } from './auth';

export class ClientError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function shouldBeAuthorized() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ClientError('Unauthorized', 401);
  }
  return session;
}

export async function shouldBeAdmin() {
  const session = await shouldBeAuthorized();
  // Read role FRESH from DB — the JWT can be stale for users promoted to
  // ADMIN after their last login. The dashboard layout already does this;
  // API routes must match.
  const { prisma } = await import('@/lib/prisma');
  const { isAdminRole } = await import('@/lib/access');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || !isAdminRole(user.role)) {
    throw new ClientError('Forbidden', 403);
  }
  return session;
}

export async function parseRequestJson<T>(request: Request, schema: { parse: (data: unknown) => T }) {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      throw new ClientError(`Validation error: ${error.message}`, 422);
    }
    throw new ClientError('Invalid JSON body');
  }
}

export function asyncWrapper(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ClientError) {
        return errorResponse(error.message, error.statusCode);
      }
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}
