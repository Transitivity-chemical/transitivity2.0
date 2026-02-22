import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import {
  asyncWrapper,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

export const GET = asyncWrapper(async () => {
  await shouldBeAuthorized();
  const data = await proxyToFastAPI('/api/v1/fitting/models');
  return successResponse(data);
});
