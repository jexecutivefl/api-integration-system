# API Integration System — Technical Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard (Next.js)                       │
│  Overview │ Integrations │ Workflows │ Logs │ Sync History   │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch()
┌──────────────────────────▼──────────────────────────────────┐
│                   API Layer (Route Handlers)                 │
│  /api/integrations │ /api/workflows │ /api/logs │ /api/sync  │
└──────┬───────────────────┬───────────────────┬──────────────┘
       │                   │                   │
┌──────▼──────┐  ┌─────────▼────────┐  ┌──────▼──────┐
│  Connectors │  │ Workflow Engine   │  │ Observability│
│  CRM        │  │ Triggers          │  │ Logger       │
│  Payment    │  │ Actions           │  │ Retry Mgr    │
│  Form       │  │ Execution History │  │ Error Store  │
│  Support    │  └──────────────────┘  └─────────────┘
└──────┬──────┘
       │ raw data
┌──────▼──────────────────────────────────────────────────────┐
│              Normalization Pipeline                          │
│  Validate → Map → Normalize → Persist                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Database (SQLite + Prisma)                 │
│  Integration │ SyncRun │ NormalizedRecord │ WorkflowDef │ …  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

- **Framework**: Next.js 14 with App Router
- **Rendering**: Server Components for data fetching, Client Components for interactivity
- **Styling**: Tailwind CSS with consistent design tokens
- **Routing**: File-system based routing under `/src/app/`
- **Data Fetching**: Server components call internal API routes via `fetch()`
- **State**: Minimal client state — most pages are server-rendered with optional client interactivity for filters/search

### Page Structure
```
/                    → Dashboard overview (redirect)
/integrations        → Integration list
/integrations/[id]   → Integration detail + sync history
/workflows           → Workflow list + execution stats
/workflows/[id]      → Workflow detail + execution history
/logs                → Log viewer with filters
/sync-history        → Sync run timeline
```

## Backend Architecture

- **Route Handlers**: Next.js App Router route handlers (`route.ts` files)
- **Pattern**: Each route handler validates input, calls service layer, returns JSON
- **Error Handling**: Centralized error wrapper that catches exceptions and returns consistent error responses
- **Response Format**: `{ success: boolean, data?: T, error?: string, meta?: object }`

### API Route Map
```
/api/integrations          GET, POST
/api/integrations/[id]     GET, PUT, DELETE
/api/integrations/[id]/sync   POST
/api/integrations/[id]/test   POST
/api/sync-runs             GET
/api/sync-runs/[id]        GET
/api/workflows             GET, POST
/api/workflows/[id]        GET, PUT, DELETE
/api/workflows/[id]/execute   POST
/api/workflow-executions   GET
/api/logs                  GET
/api/retry-queue           GET
/api/retry-queue/[id]/retry   POST
/api/retry-queue/process   POST
/api/dashboard/stats       GET
```

## Database Architecture

- **ORM**: Prisma with SQLite provider
- **Migrations**: Prisma Migrate for schema versioning
- **Client**: Singleton pattern using `globalThis` for Next.js hot-reload safety
- **JSON Storage**: SQLite lacks native JSON type — stored as `String`, serialized/deserialized in application layer
- **Seeding**: `prisma/seed.ts` populates demo data for all entities

### Entity Relationship Diagram
```
Integration 1──* SyncRun
SyncRun 1──* NormalizedRecord
WorkflowDefinition 1──* WorkflowExecution
SyncRun 1──* WorkflowExecution
LogEntry (standalone, references source)
RetryQueue (standalone, references entity by type+id)
```

## Integration Architecture (Connector Pattern)

Each external API is wrapped by a **Connector** that implements a common interface:

```typescript
interface Connector {
  type: ConnectorType;
  fetchData(config: Record<string, string>): Promise<ConnectorResult>;
  testConnection(config: Record<string, string>): Promise<boolean>;
  getStatus(): ConnectorStatus;
}
```

- **Registry**: `ConnectorRegistry` maps connector types to implementations
- **Mock Data**: Each connector loads mock responses from JSON files, simulating realistic API payloads
- **Latency Simulation**: Connectors add 200-800ms artificial delay
- **Failure Simulation**: ~10% chance of simulated transient failure for realistic error handling demos

## Workflow Engine

The workflow engine evaluates rules after data sync events:

1. **Trigger Phase**: Check all enabled `WorkflowDefinition` records against the current event
2. **Match Phase**: Evaluate trigger conditions (e.g., `entityType === 'contact'`, `syncRun.status === 'completed'`)
3. **Action Phase**: Execute matched workflow actions sequentially
4. **Record Phase**: Create `WorkflowExecution` record with status and result

### Trigger Types
- `sync_completed` — fires when a sync run finishes successfully
- `sync_failed` — fires when a sync run fails
- `new_record` — fires for each new normalized record created
- `error_threshold` — fires when error count exceeds a threshold

### Action Types
- `create_log` — write an audit log entry
- `send_notification` — simulate sending a notification
- `update_status` — update an integration's status
- `create_record` — create an internal record

## Logging & Retry Design

### Structured Logging
- All log entries stored in `LogEntry` table with: level, source, message, metadata (JSON), timestamp
- Levels: `debug`, `info`, `warn`, `error`
- Sources: `connector`, `pipeline`, `workflow`, `system`, `retry`
- Queryable via `/api/logs` with level/source/date filters

### Retry System
- Failed operations create entries in `RetryQueue`
- Each entry tracks: attempts, maxAttempts (default 3), nextRetryAt, lastError
- Backoff schedule: 30 seconds → 2 minutes → 10 minutes
- Processing triggered via `/api/retry-queue/process` endpoint
- Terminal states: `completed` (success on retry) or `failed` (max attempts exhausted)

## Security Model

- **Credentials**: Stored in `.env` file, never committed (`.env.example` provided)
- **API Routes**: Input validation on all endpoints
- **No Authentication**: Single-user system (noted as enhancement path)
- **CORS**: Default Next.js CORS behavior (same-origin)

## Local Development Flow

```bash
git clone <repo>
cd api-integration-system
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
# Open http://localhost:3000
```
