import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { asyncWrapper, ClientError, parseRequestJson, successResponse } from '@/lib/api-utils';
import { hashPasswordResetToken, isPasswordResetExpired } from '@/lib/password-reset';
import { resetPasswordSchema } from '@/lib/validators/auth';

export const GET = asyncWrapper(async (request: Request) => {
  const token = new URL(request.url).searchParams.get('token')?.trim();
  if (!token) {
    return successResponse({ valid: false });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashPasswordResetToken(token),
    },
    select: {
      id: true,
      passwordResetExpiry: true,
      isActive: true,
      deletedAt: true,
    },
  });

  const valid = Boolean(
    user &&
      user.isActive &&
      !user.deletedAt &&
      !isPasswordResetExpired(user.passwordResetExpiry),
  );

  return successResponse({ valid });
});

export const POST = asyncWrapper(async (request: Request) => {
  const data = await parseRequestJson(request, resetPasswordSchema);
  const tokenHash = hashPasswordResetToken(data.token.trim());

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
    },
  });

  if (!user || !user.isActive || user.deletedAt || isPasswordResetExpired(user.passwordResetExpiry)) {
    throw new ClientError('Invalid or expired reset token', 400);
  }

  const samePassword = await bcrypt.compare(data.newPassword, user.passwordHash);
  if (samePassword) {
    throw new ClientError('New password must be different', 400);
  }

  const newHash = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
      passwordResetTokenHash: null,
      passwordResetExpiry: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
    },
  });

  return successResponse({ ok: true });
});
