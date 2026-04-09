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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session.user as any).role !== 'ADMIN') {
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
