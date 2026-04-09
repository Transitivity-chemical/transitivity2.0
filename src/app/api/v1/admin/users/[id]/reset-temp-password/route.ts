import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';
import { generateTempPassword } from '@/lib/temp-password';
import { sendInviteEmail } from '@/lib/email';

/**
 * Phase 6 of megaplan: reset a user's password to a fresh temp password,
 * email them, and return the temp pwd to the admin (one-time display).
 */
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: RouteContext) {
  try {
    const session = await shouldBeAdmin();
    const { id } = await ctx.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ClientError('User not found', 404);

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pt-BR/login`;
    const emailResult = await sendInviteEmail({
      to: user.email,
      name: user.fullName,
      tempPassword,
      loginUrl,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_RESET_TEMP_PASSWORD',
        entityType: 'User',
        entityId: id,
        metadata: { emailSent: emailResult.sent, emailProvider: emailResult.provider },
      },
    });

    return successResponse({
      tempPassword,
      email: { sent: emailResult.sent, provider: emailResult.provider, error: emailResult.error },
    });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
