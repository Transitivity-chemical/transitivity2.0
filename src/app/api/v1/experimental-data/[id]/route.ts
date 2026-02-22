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
  // URL: /api/v1/experimental-data/{id}
  const id = segments[segments.length - 1];
  if (!id) throw new ClientError('Missing dataset ID', 400);
  return id;
}

export const GET = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const id = extractId(request);

  const dataset = await prisma.experimentalDataSet.findFirst({
    where: {
      id,
      reaction: {
        userId: session.user!.id!,
      },
    },
    include: {
      reaction: {
        select: { id: true, name: true },
      },
    },
  });

  if (!dataset) {
    throw new ClientError('Dataset not found', 404);
  }

  return successResponse({ dataset });
});

export const DELETE = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const id = extractId(request);

  const dataset = await prisma.experimentalDataSet.findFirst({
    where: {
      id,
      reaction: {
        userId: session.user!.id!,
      },
    },
  });

  if (!dataset) {
    throw new ClientError('Dataset not found', 404);
  }

  await prisma.experimentalDataSet.delete({ where: { id } });

  return successResponse({ deleted: true });
});
