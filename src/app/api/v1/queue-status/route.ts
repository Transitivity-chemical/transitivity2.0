import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { shouldBeAdmin, ClientError, successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Phase 15 of megaplan: admin-only proxy to FastAPI /api/v1/queue-status.
 */
export async function GET() {
  try {
    await shouldBeAdmin();
    const result = await proxyToFastAPI('/api/v1/queue-status', { method: 'GET' });
    return successResponse(result);
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
}
