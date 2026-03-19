import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id: params.id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    return successResponse(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workflow';
    return errorResponse(message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actions, enabled } = body;

    const existing = await prisma.workflowDefinition.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('Workflow not found', 404);
    }

    const workflow = await prisma.workflowDefinition.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerConfig !== undefined && { triggerConfig: JSON.stringify(triggerConfig) }),
        ...(actions !== undefined && { actions: JSON.stringify(actions) }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return successResponse(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update workflow';
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.workflowDefinition.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('Workflow not found', 404);
    }

    await prisma.workflowDefinition.delete({
      where: { id: params.id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete workflow';
    return errorResponse(message, 500);
  }
}
