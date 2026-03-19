import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: params.id },
      include: {
        syncRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            syncRuns: true,
            normalizedRecords: true,
          },
        },
      },
    });

    if (!integration) {
      return errorResponse('Integration not found', 404);
    }

    return successResponse(integration);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch integration';
    return errorResponse(message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, type, status, config } = body;

    const existing = await prisma.integration.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('Integration not found', 404);
    }

    const integration = await prisma.integration.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
      },
    });

    return successResponse(integration);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update integration';
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.integration.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('Integration not found', 404);
    }

    await prisma.integration.delete({
      where: { id: params.id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete integration';
    return errorResponse(message, 500);
  }
}
