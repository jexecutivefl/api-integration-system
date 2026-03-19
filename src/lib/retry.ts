import { prisma } from './db';
import { logger } from './logger';
import { config } from './config';

export async function addToRetryQueue(
  entityType: string,
  entityId: string,
  action: string,
  error: string
): Promise<void> {
  const delayMs = config.retry.initialDelayMs;
  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.retryQueue.create({
    data: {
      entityType,
      entityId,
      action,
      attempts: 0,
      maxAttempts: config.retry.maxAttempts,
      nextRetryAt,
      lastError: error,
      status: 'pending',
    },
  });

  await logger.info('retry', `Added to retry queue: ${action}`, {
    entityType,
    entityId,
    nextRetryAt: nextRetryAt.toISOString(),
  });
}

export function calculateNextRetry(attempts: number): Date {
  // Exponential backoff: 30s, 2min, 10min
  const delays = [30000, 120000, 600000];
  const delay = delays[Math.min(attempts, delays.length - 1)];
  return new Date(Date.now() + delay);
}

export async function processRetryQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  const pendingItems = await prisma.retryQueue.findMany({
    where: {
      status: 'pending',
      nextRetryAt: { lte: now },
    },
    orderBy: { nextRetryAt: 'asc' },
    take: 10,
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    await prisma.retryQueue.update({
      where: { id: item.id },
      data: { status: 'processing' },
    });

    try {
      // Attempt the retry based on entity type
      if (item.entityType === 'sync_run') {
        // Re-trigger sync would go here (connected in Phase 3)
        // For now, simulate with 70% success rate
        if (Math.random() > 0.3) {
          await prisma.retryQueue.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              attempts: item.attempts + 1,
            },
          });
          succeeded++;
          await logger.info('retry', `Retry succeeded: ${item.action}`, {
            entityType: item.entityType,
            entityId: item.entityId,
            attempt: item.attempts + 1,
          });
        } else {
          throw new Error('Simulated retry failure');
        }
      } else {
        // Generic retry - simulate
        await prisma.retryQueue.update({
          where: { id: item.id },
          data: {
            status: 'completed',
            attempts: item.attempts + 1,
          },
        });
        succeeded++;
      }
    } catch (error) {
      const newAttempts = item.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (newAttempts >= item.maxAttempts) {
        await prisma.retryQueue.update({
          where: { id: item.id },
          data: {
            status: 'failed',
            attempts: newAttempts,
            lastError: errorMessage,
          },
        });
        failed++;
        await logger.error('retry', `Retry exhausted: ${item.action}`, {
          entityType: item.entityType,
          entityId: item.entityId,
          attempts: newAttempts,
          maxAttempts: item.maxAttempts,
        });
      } else {
        const nextRetry = calculateNextRetry(newAttempts);
        await prisma.retryQueue.update({
          where: { id: item.id },
          data: {
            status: 'pending',
            attempts: newAttempts,
            nextRetryAt: nextRetry,
            lastError: errorMessage,
          },
        });
        await logger.warn('retry', `Retry failed, rescheduled: ${item.action}`, {
          entityType: item.entityType,
          entityId: item.entityId,
          attempt: newAttempts,
          nextRetryAt: nextRetry.toISOString(),
        });
      }
    }
  }

  return { processed: pendingItems.length, succeeded, failed };
}
