import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const bcryptMock = {
  compare: vi.fn(),
  hash: vi.fn(),
};

const resetMock = {
  hashPasswordResetToken: vi.fn(),
  isPasswordResetExpired: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('bcrypt', () => ({
  default: bcryptMock,
}));

vi.mock('@/lib/password-reset', () => resetMock);
vi.mock('@/lib/api-utils', () => ({
  ClientError: class ClientError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  parseRequestJson: async (request: Request, schema: { parse: (data: unknown) => unknown }) => {
    const body = await request.json();
    return schema.parse(body);
  },
  successResponse: (data: unknown, status = 200) => Response.json(data, { status }),
  asyncWrapper: (handler: (request: Request) => Promise<Response>) => async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return Response.json({ error: err.message }, { status: err.statusCode ?? 500 });
    }
  },
}));

describe('/api/v1/auth/reset-password route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMock.hashPasswordResetToken.mockReturnValue('hashed-token');
    resetMock.isPasswordResetExpired.mockReturnValue(false);
    bcryptMock.hash.mockResolvedValue('new-hash');
  });

  it('reports a valid token on GET', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      deletedAt: null,
      passwordResetExpiry: new Date('2026-04-10T13:00:00Z'),
    });

    const { GET } = await import('@/app/api/v1/auth/reset-password/route');
    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/reset-password?token=plain-token'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(resetMock.hashPasswordResetToken).toHaveBeenCalledWith('plain-token');
  });

  it('rejects expired or unknown tokens on GET', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/v1/auth/reset-password/route');
    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/reset-password?token=plain-token'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.valid).toBe(false);
  });

  it('updates the password and clears the token on POST', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      deletedAt: null,
      passwordResetExpiry: new Date('2026-04-10T13:00:00Z'),
      passwordHash: 'old-hash',
    });
    bcryptMock.compare.mockResolvedValue(false);

    const { POST } = await import('@/app/api/v1/auth/reset-password/route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'plain-token',
          newPassword: 'NovaSenhaSegura123!',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'new-hash',
        mustChangePassword: false,
        passwordResetTokenHash: null,
        passwordResetExpiry: null,
      },
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });

  it('returns a client error when reusing the current password', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      deletedAt: null,
      passwordResetExpiry: new Date('2026-04-10T13:00:00Z'),
      passwordHash: 'old-hash',
    });
    bcryptMock.compare.mockResolvedValue(true);

    const { POST } = await import('@/app/api/v1/auth/reset-password/route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'plain-token',
          newPassword: 'SamePassword123!',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('New password must be different');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
