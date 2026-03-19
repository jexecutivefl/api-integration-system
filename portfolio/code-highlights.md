# Code Highlights

Key architectural patterns and code sections worth discussing in portfolio presentations and interviews.

---

## 1. Connector Abstraction Pattern

**File:** `src/connectors/base.ts`

The connector layer uses an interface + abstract base class pattern, making it easy to add new API integrations without changing existing code.

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

  protected simulateLatency(min = 200, max = 800): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  protected shouldSimulateFailure(): boolean {
    return Math.random() < 0.1;
  }
}
```

**Why it matters:** Open/closed principle — adding a new connector only requires implementing the interface, not modifying the pipeline or dashboard.

---

## 2. Data Normalization Pipeline

**File:** `src/lib/normalization/pipeline.ts`

The pipeline orchestrates the full sync flow: fetch → validate → normalize → persist, with error handling and retry integration at each step.

```typescript
export async function runSyncPipeline(
  integrationId: string,
  connectorType: ConnectorType,
  connectorConfig: Record<string, string>
): Promise<PipelineResult> {
  const syncRun = await prisma.syncRun.create({ ... });

  try {
    // Step 1: Fetch from connector
    const result = await connector.fetchData(connectorConfig);

    // Step 2: Validate records
    const { valid, invalid } = validateBatch(result.data, entityType);

    // Step 3: Normalize valid records
    const normalized = normalizeBatch(valid, connectorType);

    // Step 4: Persist normalized records
    for (const record of normalized) {
      await prisma.normalizedRecord.create({ ... });
    }

    // Step 5: Update sync run status
    return { status: invalid.length > 0 ? 'partial' : 'completed', ... };
  } catch (error) {
    // Add to retry queue on failure
    await addToRetryQueue('sync_run', syncRun.id, ...);
    return { status: 'failed', error: errorMessage };
  }
}
```

**Why it matters:** Clean separation of concerns — each step is independently testable and the pipeline handles both success and failure paths gracefully.

---

## 3. Workflow Engine

**File:** `src/workflows/engine.ts`

The engine evaluates all enabled workflows against incoming events and executes matching actions sequentially.

```typescript
export async function evaluateWorkflows(
  event: TriggerEvent,
  syncRunId?: string
): Promise<void> {
  const workflows = await prisma.workflowDefinition.findMany({
    where: { enabled: true },
  });

  for (const workflow of workflows) {
    const triggerConfig = JSON.parse(workflow.triggerConfig);
    if (evaluateTrigger(event, workflow.triggerType, triggerConfig)) {
      await executeWorkflow(workflow.id, event, syncRunId);
    }
  }
}
```

**Why it matters:** Event-driven architecture — the engine is decoupled from the pipeline, making it easy to add new trigger types and actions without touching existing code.

---

## 4. Retry with Exponential Backoff

**File:** `src/lib/retry.ts`

Failed operations are queued with configurable retry policies and exponential backoff delays.

```typescript
export function calculateNextRetry(attempts: number): Date {
  const delays = [30000, 120000, 600000]; // 30s, 2min, 10min
  const delay = delays[Math.min(attempts, delays.length - 1)];
  return new Date(Date.now() + delay);
}

export async function processRetryQueue(): Promise<Result> {
  const pendingItems = await prisma.retryQueue.findMany({
    where: { status: 'pending', nextRetryAt: { lte: now } },
  });
  // Process each item, update status, reschedule on failure
}
```

**Why it matters:** Production-grade resilience — transient failures don't require manual intervention and the backoff prevents overwhelming failing services.

---

## 5. Structured Logging

**File:** `src/lib/logger.ts`

All system activity is logged to the database with level, source, and metadata for full observability.

```typescript
export const logger = {
  debug: (source, message, metadata?) => log('debug', source, message, metadata),
  info:  (source, message, metadata?) => log('info',  source, message, metadata),
  warn:  (source, message, metadata?) => log('warn',  source, message, metadata),
  error: (source, message, metadata?) => log('error', source, message, metadata),
};
```

**Why it matters:** Every operation is auditable — logs are searchable by level, source, and time range through the dashboard.

---

## 6. Consistent API Response Format

**File:** `src/server/api-helpers.ts`

All API endpoints return a consistent response shape with typed helpers.

```typescript
export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) });
}

export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

**Why it matters:** Predictable API contract — frontend code can rely on a consistent response shape, reducing error handling complexity.
