import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addToRetryQueue } from '@/lib/retry';
import type { ConnectorType, ConnectorResult, SyncStatus } from '@/lib/types';
import { getEntityType, normalizeBatch } from './normalizer';
import { validateBatch } from './validator';
import { getConnector } from '@/connectors/registry';

interface PipelineResult {
  syncRunId: string;
  status: SyncStatus;
  recordsProcessed: number;
  recordsFailed: number;
  error?: string;
}

export async function runSyncPipeline(
  integrationId: string,
  connectorType: ConnectorType,
  connectorConfig: Record<string, string>
): Promise<PipelineResult> {
  // Create sync run
  const syncRun = await prisma.syncRun.create({
    data: {
      integrationId,
      status: 'running',
      startedAt: new Date(),
    },
  });

  // Update integration status
  await prisma.integration.update({
    where: { id: integrationId },
    data: { status: 'syncing' },
  });

  await logger.info('pipeline', `Sync started for ${connectorType} integration`, {
    integrationId,
    syncRunId: syncRun.id,
  });

  try {
    // Step 1: Fetch data from connector
    const connector = getConnector(connectorType);
    const result: ConnectorResult = await connector.fetchData(connectorConfig);

    if (!result.success) {
      throw new Error(result.error || 'Connector fetch failed');
    }

    // Step 2: Validate records
    const entityType = getEntityType(connectorType);
    const { valid, invalid } = validateBatch(result.data, entityType);

    if (invalid.length > 0) {
      await logger.warn('pipeline', `${invalid.length} records failed validation`, {
        integrationId,
        syncRunId: syncRun.id,
        invalidCount: invalid.length,
        errors: invalid.slice(0, 3).map((i) => i.errors),
      });
    }

    // Step 3: Normalize valid records
    const normalized = normalizeBatch(valid, connectorType);

    // Step 4: Persist normalized records
    for (const record of normalized) {
      await prisma.normalizedRecord.create({
        data: {
          integrationId,
          syncRunId: syncRun.id,
          entityType,
          externalId: record.externalId,
          data: JSON.stringify(record.data),
        },
      });
    }

    // Step 5: Update sync run
    const status: SyncStatus = invalid.length > 0 ? 'partial' : 'completed';
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status,
        recordsProcessed: valid.length,
        recordsFailed: invalid.length,
        completedAt: new Date(),
      },
    });

    // Update integration
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: 'active',
        lastSyncAt: new Date(),
      },
    });

    await logger.info('pipeline', `Sync ${status}: ${valid.length} records processed`, {
      integrationId,
      syncRunId: syncRun.id,
      recordsProcessed: valid.length,
      recordsFailed: invalid.length,
    });

    return {
      syncRunId: syncRun.id,
      status,
      recordsProcessed: valid.length,
      recordsFailed: invalid.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';

    // Update sync run as failed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: 'error' },
    });

    await logger.error('pipeline', `Sync failed: ${errorMessage}`, {
      integrationId,
      syncRunId: syncRun.id,
    });

    // Add to retry queue
    await addToRetryQueue('sync_run', syncRun.id, `Re-sync ${connectorType} integration`, errorMessage);

    return {
      syncRunId: syncRun.id,
      status: 'failed',
      recordsProcessed: 0,
      recordsFailed: 0,
      error: errorMessage,
    };
  }
}
