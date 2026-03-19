import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';
import { executeWorkflowManually } from '@/workflows/engine';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id: params.id },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    if (!workflow.enabled) {
      return errorResponse('Workflow is disabled', 400);
    }

    const result = await executeWorkflowManually(params.id);
    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute workflow';
    return errorResponse(message, 500);
  }
}
