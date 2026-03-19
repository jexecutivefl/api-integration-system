import { executeCreateLog } from './create-log';
import { executeSendNotification } from './send-notification';
import { executeUpdateStatus } from './update-status';
import { executeCreateRecord } from './create-record';

type ActionExecutor = (
  config: Record<string, unknown>,
  context: Record<string, unknown>
) => Promise<{ success: boolean; error?: string }>;

const actionRegistry: Record<string, ActionExecutor> = {
  create_log: executeCreateLog,
  send_notification: executeSendNotification,
  update_status: executeUpdateStatus,
  create_record: executeCreateRecord,
};

export function getActionExecutor(actionType: string): ActionExecutor | undefined {
  return actionRegistry[actionType];
}

export function getAvailableActions(): string[] {
  return Object.keys(actionRegistry);
}
