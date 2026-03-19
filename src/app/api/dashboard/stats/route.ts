import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/server/api-helpers';

export async function GET() {
  try {
    const [
      totalIntegrations,
      activeIntegrations,
      errorIntegrations,
      totalSyncRuns,
      runningSyncRuns,
      failedSyncRuns,
      totalRecords,
      totalWorkflows,
      enabledWorkflows,
      totalExecutions,
      pendingRetries,
      recentErrors,
    ] = await Promise.all([
      prisma.integration.count(),
      prisma.integration.count({ where: { status: 'active' } }),
      prisma.integration.count({ where: { status: 'error' } }),
      prisma.syncRun.count(),
      prisma.syncRun.count({ where: { status: 'running' } }),
      prisma.syncRun.count({ where: { status: 'failed' } }),
      prisma.normalizedRecord.count(),
      prisma.workflowDefinition.count(),
      prisma.workflowDefinition.count({ where: { enabled: true } }),
      prisma.workflowExecution.count(),
      prisma.retryQueue.count({ where: { status: 'pending' } }),
      prisma.logEntry.count({ where: { level: 'error' } }),
    ]);

    const recentSyncRuns = await prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        integration: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return successResponse({
      integrations: {
        total: totalIntegrations,
        active: activeIntegrations,
        error: errorIntegrations,
      },
      syncRuns: {
        total: totalSyncRuns,
        running: runningSyncRuns,
        failed: failedSyncRuns,
      },
      records: {
        total: totalRecords,
      },
      workflows: {
        total: totalWorkflows,
        enabled: enabledWorkflows,
        totalExecutions,
      },
      retryQueue: {
        pending: pendingRetries,
      },
      logs: {
        recentErrors,
      },
      recentSyncRuns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    return errorResponse(message, 500);
  }
}
