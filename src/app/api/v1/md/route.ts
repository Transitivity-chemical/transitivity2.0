import { prisma } from '@/lib/prisma';
import {
  asyncWrapper,
  successResponse,
  shouldBeAuthorized,
} from '@/lib/api-utils';

export const GET = asyncWrapper(async () => {
  const session = await shouldBeAuthorized();

  const simulations = await prisma.mDSimulation.findMany({
    where: { userId: session.user!.id! },
    include: {
      generatedFiles: {
        select: { id: true, fileType: true, filename: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse({ simulations });
});
