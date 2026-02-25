import { prisma } from '@/lib/prisma';
import {
  asyncWrapper,
  successResponse,
  shouldBeAuthorized,
} from '@/lib/api-utils';

export const GET = asyncWrapper(async () => {
  const session = await shouldBeAuthorized();
  const userId = session.user!.id!;

  const jobs = await prisma.mLJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      mlProvider: true,
      mlTaskType: true,
      neuralPotential: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return successResponse({ jobs });
});
