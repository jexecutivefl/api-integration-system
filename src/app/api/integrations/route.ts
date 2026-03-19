import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, search, status, type, sortBy, sortOrder } = parseSearchParams(request.url);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        include: {
          _count: {
            select: {
              syncRuns: true,
              normalizedRecords: true,
            },
          },
        },
      }),
      prisma.integration.count({ where }),
    ]);

    return successResponse(integrations, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch integrations';
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, config } = body;

    if (!name || !type) {
      return errorResponse('Name and type are required', 400);
    }

    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        config: config ? JSON.stringify(config) : '{}',
      },
    });

    return successResponse(integration);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create integration';
    return errorResponse(message, 500);
  }
}
