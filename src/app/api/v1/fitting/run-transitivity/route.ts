import { fetchRemoteTransitivityFit, type TransitivityFitRequest } from '@/lib/fitting-api';
import {
  asyncWrapper,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

/**
 * Transitivity Plot fit proxy. Browser → this route → FastAPI on pitomba.
 * Avoids CORS and the mixed-content http:// block when the frontend runs on
 * https:// (Vercel).
 */
export const POST = asyncWrapper(async (request: Request) => {
  await shouldBeAuthorized();
  const body = (await request.json()) as TransitivityFitRequest;
  const result = await fetchRemoteTransitivityFit(body);
  return successResponse(result);
});
