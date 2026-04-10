import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const emailMock = {
  sendPasswordResetEmail: vi.fn(),
};

const resetMock = {
  createPasswordResetToken: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/email', () => emailMock);
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
  asyncWrapper: (handler: (request: Request) => Promise<Response>) => handler,
}));

describe('POST /api/v1/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailMock.sendPasswordResetEmail.mockResolvedValue({
      sent: true,
      provider: 'resend',
    });
    resetMock.createPasswordResetToken.mockReturnValue({
      token: 'plain-token',
      tokenHash: 'hashed-token',
      expiresAt: new Date('2026-04-10T13:00:00Z'),
    });
  });

  it('stores reset token and sends email for an active user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'Test User',
      isActive: true,
      deletedAt: null,
    });

    const { POST } = await import('@/app/api/v1/auth/forgot-password/route');
    const request = new Request('http://localhost:3000/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', locale: 'en' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordResetTokenHash: 'hashed-token',
        passwordResetExpiry: new Date('2026-04-10T13:00:00Z'),
      },
    });
    expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        name: 'Test User',
        resetUrl: 'http://localhost:3000/en/reset-password?token=plain-token',
      }),
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });

  it('returns success without sending email for missing users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/v1/auth/forgot-password/route');
    const request = new Request('http://localhost:3000/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', locale: 'en' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
