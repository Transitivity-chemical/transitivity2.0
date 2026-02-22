import { prisma } from '@/lib/prisma';
import { experimentalDataSchema } from '@/lib/validators/experimental-data';
import {
  asyncWrapper,
  ClientError,
  successResponse,
  shouldBeAuthorized,
  parseRequestJson,
} from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const data = await parseRequestJson(request, experimentalDataSchema);

  if (!data.reactionId) {
    // No reaction linked yet: validate and return data without persisting
    return successResponse({
      validated: true,
      name: data.name,
      source: data.source,
      citation: data.citation,
      doi: data.doi,
      points: data.points,
      pointCount: data.points.length,
    });
  }

  // Verify the reaction belongs to the user
  const reaction = await prisma.reaction.findFirst({
    where: { id: data.reactionId, userId: session.user!.id! },
  });

  if (!reaction) {
    throw new ClientError('Reaction not found or not owned by user', 404);
  }

  const dataset = await prisma.experimentalDataSet.create({
    data: {
      reactionId: data.reactionId,
      name: data.name,
      source: data.source ?? null,
      citation: data.citation ?? null,
      doi: data.doi ?? null,
      points: data.points,
    },
  });

  return successResponse({ dataset }, 201);
});

export const GET = asyncWrapper(async () => {
  const session = await shouldBeAuthorized();

  const datasets = await prisma.experimentalDataSet.findMany({
    where: {
      reaction: {
        userId: session.user!.id!,
      },
    },
    include: {
      reaction: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse({ datasets });
});
