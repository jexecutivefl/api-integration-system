import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';
import { runSyncPipeline } from '@/lib/normalization/pipeline';
import { evaluateWorkflows } from '@/workflows/engine';
import type { ConnectorType } from '@/lib/types';
import type { TriggerEvent } from '@/workflows/triggers';

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

    // Run the full sync pipeline: fetch → validate → normalize → persist
    const config = JSON.parse(integration.config);
    const result = await runSyncPipeline(
      integration.id,
      integration.type as ConnectorType,
      config
    );

    // Trigger workflow evaluation based on sync result
    const triggerEvent: TriggerEvent = {
      type: result.status === 'failed' ? 'sync_failed' : 'sync_completed',
      connectorType: integration.type as ConnectorType,
      syncRunId: result.syncRunId,
      integrationId: integration.id,
      recordCount: result.recordsProcessed,
      errorCount: result.recordsFailed,
    };
    await evaluateWorkflows(triggerEvent, result.syncRunId);

    // If records were created, also fire new_record triggers
    if (result.recordsProcessed > 0) {
      const newRecordEvent: TriggerEvent = {
        type: 'new_record',
        connectorType: integration.type as ConnectorType,
        entityType: integration.type === 'crm' ? 'contact'
          : integration.type === 'payment' ? 'transaction'
          : integration.type === 'form' ? 'submission'
          : 'ticket',
        syncRunId: result.syncRunId,
        integrationId: integration.id,
        recordCount: result.recordsProcessed,
      };
      await evaluateWorkflows(newRecordEvent, result.syncRunId);
    }

    const syncRun = await prisma.syncRun.findUnique({
      where: { id: result.syncRunId },
    });

    return successResponse(syncRun);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to trigger sync';
    return errorResponse(message, 500);
  }
}
