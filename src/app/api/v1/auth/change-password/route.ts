import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { asyncWrapper, ClientError, successResponse, parseRequestJson } from '@/lib/api-utils';

/**
 * Phase 5 of megaplan: forced first-login password change.
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 5
 *           docs/research-external.md §1 (server-side enforcement)
 */
const bodySchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(200),
  })
  .strict();

export const POST = asyncWrapper(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ClientError('Unauthorized', 401);
  }

  const data = await parseRequestJson(request, bodySchema);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new ClientError('User not found', 404);
  }

  const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!ok) {
    throw new ClientError('Current password is incorrect', 401);
  }

  if (data.currentPassword === data.newPassword) {
    throw new ClientError('New password must be different', 400);
  }

  const newHash = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
    },
  });

  return successResponse({ ok: true });
});
