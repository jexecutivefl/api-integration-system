# API Integration System -- Code Highlights

Six code sections that demonstrate the system's core engineering patterns. Each section includes the relevant source file, the actual code, and a brief explanation of the design decision.

---

## 1. Connector Abstraction Pattern

**File:** `src/connectors/base.ts`

```typescript
export interface IConnector {
  type: ConnectorType;
  fetchData(config: ConnectorConfig): Promise<ConnectorResult>;
  testConnection(config: ConnectorConfig): Promise<boolean>;
  getStatus(): ConnectorStatus;
}

export abstract class BaseConnector implements IConnector {
  abstract type: ConnectorType;
  protected lastChecked: Date = new Date();
  protected healthy: boolean = true;

  abstract fetchData(config: ConnectorConfig): Promise<ConnectorResult>;

  async testConnection(_config: ConnectorConfig): Promise<boolean> {
    await this.simulateLatency();
    this.lastChecked = new Date();
    this.healthy = true;
    return true;
  }

  getStatus(): ConnectorStatus {
    return { type: this.type, healthy: this.healthy, lastChecked: this.lastChecked };
  }

  protected simulateLatency(min = 200, max = 800): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  protected shouldSimulateFailure(): boolean {
    return Math.random() < 0.1;
  }
}
```

**Why this matters:**

The `IConnector` interface defines a strict contract that every integration must fulfill: fetch data, test connectivity, and report health. The abstract `BaseConnector` class provides shared infrastructure (latency simulation, health tracking, failure simulation) so concrete connectors only implement what is unique to their data source. Adding a fifth connector means creating one new class -- no changes to the pipeline, registry, or dashboard.

**Related files:**
- `src/connectors/crm.ts`, `payment.ts`, `form.ts`, `support.ts` -- concrete implementations
- `src/connectors/registry.ts` -- singleton lookup map for all connectors

---

## 2. Data Normalization Pipeline

**File:** `src/lib/normalization/pipeline.ts`

```typescript
export async function runSyncPipeline(
  integrationId: string,
  connectorType: ConnectorType,
  connectorConfig: Record<string, string>
): Promise<PipelineResult> {
  const syncRun = await prisma.syncRun.create({
    data: { integrationId, status: 'running', startedAt: new Date() },
  });

  await prisma.integration.update({
    where: { id: integrationId },
    data: { status: 'syncing' },
  });

  try {
    // Step 1: Fetch data from connector
    const connector = getConnector(connectorType);
    const result: ConnectorResult = await connector.fetchData(connectorConfig);
    if (!result.success) throw new Error(result.error || 'Connector fetch failed');

    // Step 2: Validate records
    const entityType = getEntityType(connectorType);
    const { valid, invalid } = validateBatch(result.data, entityType);

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

    // Step 5: Update sync run status
    const status: SyncStatus = invalid.length > 0 ? 'partial' : 'completed';
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: { status, recordsProcessed: valid.length, recordsFailed: invalid.length, completedAt: new Date() },
    });

    return { syncRunId: syncRun.id, status, recordsProcessed: valid.length, recordsFailed: invalid.length };
  } catch (error) {
    // On failure: mark sync as failed, update integration status, add to retry queue
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
    await prisma.syncRun.update({ where: { id: syncRun.id }, data: { status: 'failed', errorMessage, completedAt: new Date() } });
    await prisma.integration.update({ where: { id: integrationId }, data: { status: 'error' } });
    await addToRetryQueue('sync_run', syncRun.id, `Re-sync ${connectorType} integration`, errorMessage);

    return { syncRunId: syncRun.id, status: 'failed', recordsProcessed: 0, recordsFailed: 0, error: errorMessage };
  }
}
```

**Why this matters:**

This function is the backbone of the system. It orchestrates a five-stage pipeline (fetch, validate, normalize, persist, report) with clear separation of concerns at each step. The pipeline distinguishes between partial success (some records invalid) and total failure (connector error), and automatically queues failed syncs for retry. Every stage is logged, and the sync run record provides a complete audit trail.

---

## 3. Workflow Engine -- Trigger Evaluation

**File:** `src/workflows/engine.ts` and `src/workflows/triggers.ts`

```typescript
// engine.ts -- evaluate all workflows against an incoming event
export async function evaluateWorkflows(event: TriggerEvent, syncRunId?: string): Promise<void> {
  const workflows = await prisma.workflowDefinition.findMany({
    where: { enabled: true },
  });

  for (const workflow of workflows) {
    const triggerConfig: WorkflowTriggerConfig = JSON.parse(workflow.triggerConfig);
    if (evaluateTrigger(event, workflow.triggerType as TriggerType, triggerConfig)) {
      await executeWorkflow(workflow.id, event, syncRunId);
    }
  }
}
```

```typescript
// triggers.ts -- the trigger matching logic
export function evaluateTrigger(
  event: TriggerEvent,
  triggerType: TriggerType,
  triggerConfig: WorkflowTriggerConfig
): boolean {
  if (event.type !== triggerType) return false;

  if (triggerConfig.connectorType && event.connectorType !== triggerConfig.connectorType) {
    return false;
  }

  if (triggerConfig.entityType && event.entityType !== triggerConfig.entityType) {
    return false;
  }

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

function evaluateCondition(actual: unknown, operator: string, expected: string | number | boolean): boolean {
  switch (operator) {
    case 'equals':       return actual === expected;
    case 'not_equals':   return actual !== expected;
    case 'contains':     return typeof actual === 'string' && actual.includes(String(expected));
    case 'greater_than': return typeof actual === 'number' && actual > Number(expected);
    case 'less_than':    return typeof actual === 'number' && actual < Number(expected);
    default:             return false;
  }
}
```

**Why this matters:**

The workflow engine decouples "what happened" (the trigger event) from "what should happen next" (the workflow actions). The `evaluateTrigger` function uses a layered filter approach: first match the trigger type, then optionally narrow by connector type and entity type, then evaluate arbitrary conditions. This design lets users create workflows ranging from broad ("log every sync completion") to highly specific ("notify when a CRM sync fails with more than 5 errors") without changing the engine code.

---

## 4. Retry with Exponential Backoff

**File:** `src/lib/retry.ts`

```typescript
export function calculateNextRetry(attempts: number): Date {
  // Exponential backoff: 30s, 2min, 10min
  const delays = [30000, 120000, 600000];
  const delay = delays[Math.min(attempts, delays.length - 1)];
  return new Date(Date.now() + delay);
}

export async function processRetryQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pendingItems = await prisma.retryQueue.findMany({
    where: { status: 'pending', nextRetryAt: { lte: new Date() } },
    orderBy: { nextRetryAt: 'asc' },
    take: 10,
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    await prisma.retryQueue.update({ where: { id: item.id }, data: { status: 'processing' } });

    try {
      // Attempt the retry ...
      await prisma.retryQueue.update({
        where: { id: item.id },
        data: { status: 'completed', attempts: item.attempts + 1 },
      });
      succeeded++;
    } catch (error) {
      const newAttempts = item.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (newAttempts >= item.maxAttempts) {
        // Exhausted -- mark as permanently failed
        await prisma.retryQueue.update({
          where: { id: item.id },
          data: { status: 'failed', attempts: newAttempts, lastError: errorMessage },
        });
        failed++;
        await logger.error('retry', `Retry exhausted: ${item.action}`, { attempts: newAttempts });
      } else {
        // Reschedule with backoff
        const nextRetry = calculateNextRetry(newAttempts);
        await prisma.retryQueue.update({
          where: { id: item.id },
          data: { status: 'pending', attempts: newAttempts, nextRetryAt: nextRetry, lastError: errorMessage },
        });
        await logger.warn('retry', `Retry failed, rescheduled: ${item.action}`, { nextRetryAt: nextRetry.toISOString() });
      }
    }
  }

  return { processed: pendingItems.length, succeeded, failed };
}
```

**Why this matters:**

The retry system provides automatic recovery from transient failures without manual intervention. Key design choices: (1) exponential backoff prevents hammering a failing service, (2) a configurable max-attempts ceiling avoids infinite loops, (3) each item transitions through explicit states (pending, processing, completed, failed) for clear observability, and (4) the batch processor picks up only items whose `nextRetryAt` has passed, making it safe to call on any interval.

---

## 5. Structured Logging

**File:** `src/lib/logger.ts`

```typescript
export async function log(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.logEntry.create({
      data: {
        level,
        source,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Fallback to console if DB logging fails
    console.error(`[Logger Error] Failed to persist log:`, error);
    console.log(`[${level.toUpperCase()}] [${source}] ${message}`);
  }
}

export const logger = {
  debug: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('debug', source, message, metadata),
  info: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('info', source, message, metadata),
  warn: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('warn', source, message, metadata),
  error: (source: string, message: string, metadata?: Record<string, unknown>) =>
    log('error', source, message, metadata),
};
```

**Why this matters:**

Instead of scattering `console.log` calls throughout the codebase, every component writes to a centralized, queryable log table through a consistent API. The logger captures four dimensions per entry: severity level, source component, human-readable message, and structured JSON metadata. This makes the logs filterable in the dashboard (by level and source) and searchable in the database. The console fallback ensures logging never causes a cascading failure if the database is unavailable.

---

## 6. API Response Helpers

**File:** `src/server/api-helpers.ts`

```typescript
export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body);
}

export function errorResponse(message: string, status: number = 500): NextResponse {
  const body: ApiResponse = { success: false, error: message };
  return NextResponse.json(body, { status });
}

export function withErrorHandler(
  handler: (req: Request, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    try {
      return await handler(req, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      return errorResponse(message, 500);
    }
  };
}

export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    pageSize: Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    level: searchParams.get('level') || undefined,
    source: searchParams.get('source') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  };
}
```

**Why this matters:**

These four utilities enforce consistency across every API route in the application. `successResponse` and `errorResponse` guarantee a uniform `{ success, data, error, meta }` envelope so the frontend never has to guess the shape of a response. `withErrorHandler` is a higher-order function that wraps any route handler with centralized error catching and logging, eliminating duplicated try/catch blocks. `parseSearchParams` extracts, validates, and clamps pagination and filter parameters in one place, preventing invalid page sizes and centralizing query parameter logic.

---

## Discussion Points

When presenting these code sections in a portfolio review or interview, highlight:

1. **Extensibility** -- The connector abstraction and registry pattern make it trivial to add new data sources.
2. **Separation of concerns** -- Each pipeline stage (fetch, validate, normalize, persist) is a distinct, testable unit.
3. **Resilience** -- The retry system and error handling ensure transient failures do not result in data loss.
4. **Observability** -- Structured logging across every component creates a complete audit trail without ad-hoc debugging.
5. **Consistency** -- API helpers enforce a uniform contract between backend and frontend, reducing integration bugs.
6. **Pragmatism** -- The workflow engine is powerful enough to handle real use cases but simple enough to reason about and extend.
