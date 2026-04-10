import { prisma } from '@/lib/prisma';
import { asyncWrapper, parseRequestJson, successResponse } from '@/lib/api-utils';
import { sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetToken } from '@/lib/password-reset';
import { forgotPasswordSchema } from '@/lib/validators/auth';

export const POST = asyncWrapper(async (request: Request) => {
  const data = await parseRequestJson(request, forgotPasswordSchema);
  const email = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (user && user.isActive && !user.deletedAt) {
    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    const locale = data.locale ?? 'pt-BR';
    const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const resetUrl = `${origin}/${locale}/reset-password?token=${encodeURIComponent(token)}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiry: expiresAt,
      },
    });

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      resetUrl,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          emailProvider: emailResult.provider,
          emailSent: emailResult.sent,
        },
      },
    });
  }

  return successResponse({
    ok: true,
    message:
      'If an account with that email exists, we sent a password reset link.',
  });
});
