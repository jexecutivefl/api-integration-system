import { logger } from '@/lib/logger';
import type { LogLevel } from '@/lib/types';

interface CreateLogConfig {
  level?: string;
  message?: string;
}

export async function executeCreateLog(
  config: CreateLogConfig,
  context: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const level = (config.level || 'info') as LogLevel;
    const message = config.message || 'Workflow action executed';

    await logger[level]('workflow', message, {
      workflowAction: 'create_log',
      ...context,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create log',
    };
  }
}
