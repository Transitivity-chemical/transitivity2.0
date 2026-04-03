import { runRemoteFit, type FittingMultiRequest } from '@/lib/fitting-api';
import {
  asyncWrapper,
  ClientError,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  await shouldBeAuthorized();
  const body = (await request.json()) as FittingMultiRequest;

  if (!Array.isArray(body?.temperatures) || !Array.isArray(body?.rateConstants)) {
    throw new ClientError('temperatures and rateConstants are required', 400);
  }

  if (!Array.isArray(body?.modelTypes) || body.modelTypes.length === 0) {
    throw new ClientError('modelTypes is required', 400);
  }

  const settled = await Promise.allSettled(
    body.modelTypes.map((modelType) =>
      runRemoteFit(modelType, body.temperatures, body.rateConstants, body.gsaParams),
    ),
  );

  const results = settled
    .filter((item): item is PromiseFulfilledResult<Awaited<ReturnType<typeof runRemoteFit>>> => item.status === 'fulfilled')
    .map((item) => item.value);

  const errors = settled
    .map((item, index) => ({ item, modelType: body.modelTypes[index] }))
    .filter((entry): entry is { item: PromiseRejectedResult; modelType: string } => entry.item.status === 'rejected')
    .map((entry) => ({
      modelType: entry.modelType,
      error: entry.item.reason instanceof Error ? entry.item.reason.message : 'Unknown fitting error',
    }));

  return successResponse({
    results,
    errors,
  });
});
