import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import {
  asyncWrapper,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  await shouldBeAuthorized();
  const body = await request.json();
  const data = await proxyToFastAPI('/api/v1/fitting/run-multi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return successResponse(data);
});
