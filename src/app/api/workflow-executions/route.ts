import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, status, sortOrder } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId') || undefined;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (workflowId) {
      where.workflowId = workflowId;
    }
    if (status) {
      where.status = status;
    }

    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startedAt: sortOrder },
        include: {
          workflow: {
            select: { id: true, name: true, triggerType: true },
          },
        },
      }),
      prisma.workflowExecution.count({ where }),
    ]);

    return successResponse(executions, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workflow executions';
    return errorResponse(message, 500);
  }
}
