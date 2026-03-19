# Data Contracts

## Internal Data Model

All types are defined in `src/lib/types.ts` and serve as the single source of truth.

### Integration
Represents a configured connection to an external API.
```typescript
{
  id: string
  name: string              // "Salesforce CRM", "Stripe Payments"
  type: ConnectorType       // "crm" | "payment" | "form" | "support"
  status: IntegrationStatus // "active" | "inactive" | "error" | "syncing"
  config: string            // JSON-encoded configuration
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### SyncRun
A single execution of data sync for an integration.
```typescript
{
  id: string
  integrationId: string
  status: SyncStatus        // "running" | "completed" | "failed" | "partial"
  recordsProcessed: number
  recordsFailed: number
  errorMessage: string | null
  startedAt: Date
  completedAt: Date | null
}
```

### NormalizedRecord
A data record transformed into the internal standard format.
```typescript
{
  id: string
  integrationId: string
  syncRunId: string
  entityType: EntityType    // "contact" | "transaction" | "submission" | "ticket"
  externalId: string        // ID from the source system
  data: string              // JSON-encoded normalized data
  normalizedAt: Date
}
```

### WorkflowDefinition
An automation rule that fires on data events.
```typescript
{
  id: string
  name: string
  description: string
  triggerType: TriggerType   // "sync_completed" | "sync_failed" | "new_record" | "error_threshold"
  triggerConfig: string      // JSON-encoded trigger conditions
  actions: string            // JSON-encoded action list
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

### WorkflowExecution
A record of a workflow being triggered and executed.
```typescript
{
  id: string
  workflowId: string
  syncRunId: string | null
  status: ExecutionStatus    // "running" | "completed" | "failed"
  result: string             // JSON-encoded execution result
  startedAt: Date
  completedAt: Date | null
}
```

### LogEntry
A structured log record.
```typescript
{
  id: string
  level: LogLevel            // "debug" | "info" | "warn" | "error"
  source: string             // "connector" | "pipeline" | "workflow" | "system" | "retry"
  message: string
  metadata: string | null    // JSON-encoded additional context
  timestamp: Date
}
```

### RetryQueue
A failed operation pending retry.
```typescript
{
  id: string
  entityType: string         // "sync_run" | "workflow_execution"
  entityId: string
  action: string             // Description of what to retry
  attempts: number
  maxAttempts: number         // Default: 3
  nextRetryAt: Date
  lastError: string | null
  status: RetryStatus        // "pending" | "processing" | "completed" | "failed"
  createdAt: Date
  updatedAt: Date
}
```

## API Response Format

All API endpoints return:
```typescript
{
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}
```

## Connector Result Format

```typescript
{
  success: boolean
  data: RawRecord[]
  error?: string
  metadata: {
    fetchedAt: Date
    recordCount: number
    source: string
  }
}
```

## Enums

```typescript
type ConnectorType = "crm" | "payment" | "form" | "support"
type IntegrationStatus = "active" | "inactive" | "error" | "syncing"
type SyncStatus = "running" | "completed" | "failed" | "partial"
type EntityType = "contact" | "transaction" | "submission" | "ticket"
type TriggerType = "sync_completed" | "sync_failed" | "new_record" | "error_threshold"
type ExecutionStatus = "running" | "completed" | "failed"
type LogLevel = "debug" | "info" | "warn" | "error"
type RetryStatus = "pending" | "processing" | "completed" | "failed"
```
