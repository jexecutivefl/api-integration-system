import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, parseSearchParams } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, level, source, search, sortOrder } = parseSearchParams(request.url);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (level) {
      where.level = level;
    }
    if (source) {
      where.source = source;
    }
    if (search) {
      where.message = { contains: search };
    }

    const [logs, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: sortOrder },
      }),
      prisma.logEntry.count({ where }),
    ]);

    return successResponse(logs, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch logs';
    return errorResponse(message, 500);
  }
}
