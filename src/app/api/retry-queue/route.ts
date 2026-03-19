import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, sortOrder } = parseSearchParams(request.url);
    const skip = (page - 1) * pageSize;

    const where = { status: 'pending' as const };

    const [items, total] = await Promise.all([
      prisma.retryQueue.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { nextRetryAt: sortOrder },
      }),
      prisma.retryQueue.count({ where }),
    ]);

    return successResponse(items, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch retry queue';
    return errorResponse(message, 500);
  }
}
