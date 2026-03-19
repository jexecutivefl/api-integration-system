import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, status, sortOrder } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId') || undefined;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (integrationId) {
      where.integrationId = integrationId;
    }
    if (status) {
      where.status = status;
    }

    const [syncRuns, total] = await Promise.all([
      prisma.syncRun.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startedAt: sortOrder },
        include: {
          integration: {
            select: { id: true, name: true, type: true },
          },
        },
      }),
      prisma.syncRun.count({ where }),
    ]);

    return successResponse(syncRuns, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sync runs';
    return errorResponse(message, 500);
  }
}
