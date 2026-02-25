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
  if (!id) throw new ClientError('Missing job ID', 400);
  return id;
}

export const GET = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const userId = session.user!.id!;
  const id = extractId(request);

  const job = await prisma.mLJob.findFirst({
    where: { id, userId },
  });

  if (!job) {
    throw new ClientError('ML job not found', 404);
  }

  return successResponse({ job });
});
