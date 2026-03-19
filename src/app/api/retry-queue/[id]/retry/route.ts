import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.retryQueue.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return errorResponse('Retry queue item not found', 404);
    }

    if (item.status !== 'pending' && item.status !== 'failed') {
      return errorResponse(`Cannot retry item with status "${item.status}"`, 400);
    }

    if (item.attempts >= item.maxAttempts) {
      return errorResponse('Maximum retry attempts exceeded', 400);
    }

    // Update the retry queue item: increment attempts, set to processing
    await prisma.retryQueue.update({
      where: { id: params.id },
      data: {
        status: 'processing',
        attempts: item.attempts + 1,
      },
    });

    // Mock: mark as completed (real retry logic will be wired later)
    const completed = await prisma.retryQueue.update({
      where: { id: params.id },
      data: {
        status: 'completed',
      },
    });

    return successResponse(completed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retry item';
    return errorResponse(message, 500);
  }
}
