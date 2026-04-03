import { fetchRemoteTheoryFit, runRemoteFit, type FittingRunRequest } from '@/lib/fitting-api';
import {
  asyncWrapper,
  ClientError,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  await shouldBeAuthorized();
  const body = await request.json();

  if (body?.theory) {
    const result = await fetchRemoteTheoryFit(body as FittingRunRequest);
    return successResponse({ result });
  }

  if (!body?.modelType) {
    throw new ClientError('theory or modelType is required', 400);
  }

  const result = await runRemoteFit(body.modelType, body.temperatures ?? [], body.rateConstants ?? [], body.gsaParams);

  return successResponse({ result });
});
