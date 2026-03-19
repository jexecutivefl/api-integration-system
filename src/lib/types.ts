// ============================================================
// API Integration System — Core Type Definitions
// Single source of truth for all data contracts
// ============================================================

// --- Enums ---

export type ConnectorType = 'crm' | 'payment' | 'form' | 'support';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'syncing';

export type SyncStatus = 'running' | 'completed' | 'failed' | 'partial';

export type EntityType = 'contact' | 'transaction' | 'submission' | 'ticket';

export type TriggerType = 'sync_completed' | 'sync_failed' | 'new_record' | 'error_threshold';

export type ExecutionStatus = 'running' | 'completed' | 'failed';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type RetryStatus = 'pending' | 'processing' | 'completed' | 'failed';

// --- Core Entities ---

export interface Integration {
  id: string;
  name: string;
  type: ConnectorType;
  status: IntegrationStatus;
  config: string; // JSON-encoded
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncRun {
  id: string;
  integrationId: string;
  status: SyncStatus;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface NormalizedRecord {
  id: string;
  integrationId: string;
  syncRunId: string;
  entityType: EntityType;
  externalId: string;
  data: string; // JSON-encoded normalized data
  normalizedAt: Date;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerConfig: string; // JSON-encoded
  actions: string; // JSON-encoded action list
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  syncRunId: string | null;
  status: ExecutionStatus;
  result: string; // JSON-encoded
  startedAt: Date;
  completedAt: Date | null;
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata: string | null; // JSON-encoded
  timestamp: Date;
}

export interface RetryQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  lastError: string | null;
  status: RetryStatus;
  createdAt: Date;
  updatedAt: Date;
}

// --- API Response ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

// --- Connector Types ---

export interface RawRecord {
  id: string;
  [key: string]: unknown;
}

export interface ConnectorResult {
  success: boolean;
  data: RawRecord[];
  error?: string;
  metadata: {
    fetchedAt: Date;
    recordCount: number;
    source: string;
  };
}

export interface ConnectorStatus {
  type: ConnectorType;
  healthy: boolean;
  lastChecked: Date;
  message?: string;
}

export interface ConnectorConfig {
  apiKey?: string;
  baseUrl?: string;
  webhookSecret?: string;
  [key: string]: string | undefined;
}

// --- Workflow Types ---

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface WorkflowAction {
  type: 'create_log' | 'send_notification' | 'update_status' | 'create_record';
  config: Record<string, unknown>;
}

export interface WorkflowTriggerConfig {
  connectorType?: ConnectorType;
  entityType?: EntityType;
  conditions?: TriggerCondition[];
}

export interface WorkflowExecutionResult {
  actionsExecuted: number;
  actionResults: Array<{
    type: string;
    success: boolean;
    error?: string;
  }>;
}

// --- Dashboard Types ---

export interface DashboardStats {
  totalIntegrations: number;
  activeIntegrations: number;
  totalSyncRuns: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalRecords: number;
  totalWorkflows: number;
  activeWorkflows: number;
  pendingRetries: number;
  recentErrors: number;
}

export interface ActivityItem {
  id: string;
  type: 'sync' | 'workflow' | 'error' | 'retry';
  title: string;
  description: string;
  status: string;
  timestamp: Date;
}
