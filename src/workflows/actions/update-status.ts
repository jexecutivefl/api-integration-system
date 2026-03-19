import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { IntegrationStatus } from '@/lib/types';

interface UpdateStatusConfig {
  status?: string;
}

export async function executeUpdateStatus(
  config: UpdateStatusConfig,
  context: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const integrationId = context.integrationId as string;
    if (!integrationId) {
      return { success: false, error: 'No integrationId in context' };
    }

    const newStatus = (config.status || 'error') as IntegrationStatus;

    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: newStatus },
    });

    await logger.info('workflow', `Integration status updated to ${newStatus}`, {
      workflowAction: 'update_status',
      integrationId,
      newStatus,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}
