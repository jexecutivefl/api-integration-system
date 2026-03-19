import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';
import { getConnector } from '@/connectors/registry';
import type { ConnectorType } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: params.id },
    });

    if (!integration) {
      return errorResponse('Integration not found', 404);
    }

    const connector = getConnector(integration.type as ConnectorType);
    const config = JSON.parse(integration.config);
    const connected = await connector.testConnection(config);

    return successResponse({ connected });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to test connection';
    return errorResponse(message, 500);
  }
}
