import { successResponse, errorResponse } from '@/server/api-helpers';
import { processRetryQueue } from '@/lib/retry';

export async function POST() {
  try {
    const result = await processRetryQueue();
    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process retry queue';
    return errorResponse(message, 500);
  }
}
