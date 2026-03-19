import type { TriggerType, WorkflowTriggerConfig, ConnectorType, EntityType } from '@/lib/types';

interface TriggerEvent {
  type: TriggerType;
  connectorType?: ConnectorType;
  entityType?: EntityType;
  syncRunId?: string;
  integrationId?: string;
  recordCount?: number;
  errorCount?: number;
}

export function evaluateTrigger(
  event: TriggerEvent,
  triggerType: TriggerType,
  triggerConfig: WorkflowTriggerConfig
): boolean {
  // Must match trigger type
  if (event.type !== triggerType) return false;

  // Check connector type filter
  if (triggerConfig.connectorType && event.connectorType !== triggerConfig.connectorType) {
    return false;
  }

  // Check entity type filter
  if (triggerConfig.entityType && event.entityType !== triggerConfig.entityType) {
    return false;
  }

  // Check additional conditions
  if (triggerConfig.conditions) {
    for (const condition of triggerConfig.conditions) {
      const value = event[condition.field as keyof TriggerEvent];
      if (!evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }
  }

  return true;
}

function evaluateCondition(
  actual: unknown,
  operator: string,
  expected: string | number | boolean
): boolean {
  switch (operator) {
    case 'equals':
      return actual === expected;
    case 'not_equals':
      return actual !== expected;
    case 'contains':
      return typeof actual === 'string' && actual.includes(String(expected));
    case 'greater_than':
      return typeof actual === 'number' && actual > Number(expected);
    case 'less_than':
      return typeof actual === 'number' && actual < Number(expected);
    default:
      return false;
  }
}

export type { TriggerEvent };
