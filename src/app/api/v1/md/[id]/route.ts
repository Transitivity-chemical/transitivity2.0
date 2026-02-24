import { prisma } from '@/lib/prisma';
import {
  asyncWrapper,
  ClientError,
  successResponse,
  shouldBeAuthorized,
} from '@/lib/api-utils';

function extractId(request: Request): string {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1];
  if (!id) throw new ClientError('Missing simulation ID', 400);
  return id;
}

export const GET = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const id = extractId(request);

  const simulation = await prisma.mDSimulation.findFirst({
    where: { id, userId: session.user!.id! },
    include: {
      inputMolecules: { include: { atoms: { orderBy: { atomIndex: 'asc' } } } },
      generatedFiles: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!simulation) {
    throw new ClientError('Simulation not found', 404);
  }

  return successResponse({ simulation });
});

export const DELETE = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const id = extractId(request);

  const simulation = await prisma.mDSimulation.findFirst({
    where: { id, userId: session.user!.id! },
  });

  if (!simulation) {
    throw new ClientError('Simulation not found', 404);
  }

  await prisma.mDSimulation.delete({ where: { id } });

  return successResponse({ deleted: true });
});
