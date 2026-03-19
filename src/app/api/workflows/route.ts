import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, search, sortBy, sortOrder } = parseSearchParams(request.url);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }

    const [workflows, total] = await Promise.all([
      prisma.workflowDefinition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        include: {
          _count: {
            select: { executions: true },
          },
        },
      }),
      prisma.workflowDefinition.count({ where }),
    ]);

    return successResponse(workflows, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actions, enabled } = body;

    if (!name || !triggerType) {
      return errorResponse('Name and triggerType are required', 400);
    }

    const workflow = await prisma.workflowDefinition.create({
      data: {
        name,
        description: description || '',
        triggerType,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : '{}',
        actions: actions ? JSON.stringify(actions) : '[]',
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return successResponse(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create workflow';
    return errorResponse(message, 500);
  }
}
