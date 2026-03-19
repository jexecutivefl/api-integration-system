import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const syncRun = await prisma.syncRun.findUnique({
      where: { id: params.id },
      include: {
        integration: {
          select: { id: true, name: true, type: true },
        },
        normalizedRecords: {
          orderBy: { normalizedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!syncRun) {
      return errorResponse('Sync run not found', 404);
    }

    return successResponse(syncRun);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sync run';
    return errorResponse(message, 500);
  }
}
