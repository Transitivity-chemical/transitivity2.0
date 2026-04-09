import { NextRequest } from 'next/server';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { shouldBeAuthorized, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 14B of megaplan: proxy to FastAPI /api/v1/md/generate-multi.
 */
export async function POST(request: NextRequest) {
  try {
    await shouldBeAuthorized();
    const body = await request.json();
    const result = await proxyToFastAPI('/api/v1/md/generate-multi', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return successResponse(result);
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
