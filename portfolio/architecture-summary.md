# API Integration System -- Architecture Summary

## System Architecture Diagram

```
+------------------------------------------------------------------+
|                        NEXT.JS APPLICATION                        |
|                                                                   |
|  +--------------------+    +----------------------------------+   |
|  |   DASHBOARD (RSC)  |    |        REST API LAYER            |   |
|  |                     |    |                                  |   |
|  |  / Dashboard        |    |  /api/integrations     CRUD     |   |
|  |  /integrations      |    |  /api/integrations/:id/sync     |   |
|  |  /integrations/:id  |    |  /api/integrations/:id/test     |   |
|  |  /workflows         |    |  /api/sync-runs         Query   |   |
|  |  /workflows/:id     |    |  /api/workflows         CRUD    |   |
|  |  /sync-history      |    |  /api/workflows/:id/execute     |   |
|  |  /logs              |    |  /api/logs              Query   |   |
|  +--------------------+    |  /api/retry-queue       Query   |   |
|                             |  /api/retry-queue/process       |   |
|                             |  /api/dashboard/stats           |   |
|                             +----------------------------------+   |
+------------------------------------------------------------------+
        |                              |
        v                              v
+------------------------------------------------------------------+
|                      CORE ENGINE LAYER                            |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+  |
|  | CONNECTOR LAYER  |  |  SYNC PIPELINE   |  | WORKFLOW ENGINE |  |
|  |                  |  |                  |  |                 |  |
|  |  IConnector      |  |  1. Fetch        |  |  Trigger Eval   |  |
|  |  BaseConnector   |  |  2. Validate     |  |  Condition Chk  |  |
|  |  +-----------+   |  |  3. Normalize    |  |  Action Exec    |  |
|  |  | CRM       |   |  |  4. Persist      |  |  Result Track   |  |
|  |  | Payment   |   |  |  5. Report       |  |                 |  |
|  |  | Form      |   |  |                  |  +-----------------+  |
|  |  | Support   |   |  +------------------+                      |
|  |  +-----------+   |          |                                  |
|  +------------------+          v                                  |
|                       +------------------+  +-----------------+   |
|                       |  RETRY SYSTEM    |  | STRUCTURED LOG  |   |
|                       |                  |  |                 |   |
|                       |  Exp. Backoff    |  |  Level Filter   |   |
|                       |  30s > 2m > 10m  |  |  Source Filter  |   |
|                       |  Max 3 attempts  |  |  JSON Metadata  |   |
|                       +------------------+  +-----------------+   |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|                     DATA LAYER (PRISMA + SQLITE)                  |
|                                                                   |
|  Integration | SyncRun | NormalizedRecord | WorkflowDefinition    |
|  WorkflowExecution | LogEntry | RetryQueue                       |
+------------------------------------------------------------------+
```

---

## Major Components

### 1. Connector Layer

The connector layer defines a uniform interface for fetching data from external services.

```
IConnector (Interface)
    |
    +-- fetchData(config) -> ConnectorResult
    +-- testConnection(config) -> boolean
    +-- getStatus() -> ConnectorStatus

BaseConnector (Abstract Class)
    |
    +-- CrmConnector        --> contacts
    +-- PaymentConnector     --> transactions
    +-- FormConnector        --> submissions
    +-- SupportConnector     --> tickets

ConnectorRegistry
    +-- getConnector(type)   --> IConnector
    +-- getAllConnectors()    --> IConnector[]
```

Each connector returns a `ConnectorResult` containing raw records, success status, and fetch metadata. The base class provides shared utilities like latency simulation and failure simulation for demo resilience testing.

### 2. Data Normalization Pipeline

The sync pipeline is the central data flow path. It orchestrates the full lifecycle of a sync operation.

```
  Trigger Sync
       |
       v
  +----------+     +-----------+     +------------+     +---------+     +--------+
  |  FETCH   | --> | VALIDATE  | --> | NORMALIZE  | --> | PERSIST | --> | REPORT |
  | Raw data |     | Schema    |     | Map fields |     | Write   |     | Status |
  | from API |     | check     |     | to canon.  |     | to DB   |     | + Log  |
  +----------+     +-----------+     +------------+     +---------+     +--------+
       |                 |                                                   |
       v                 v                                                   v
  On failure:       Invalid records                                   On failure:
  Queue retry       logged + counted                                  Queue retry
```

**Entity mapping:**

| Connector | Entity Type | Normalized Fields                      |
|-----------|-------------|----------------------------------------|
| CRM       | contact     | name, email, company, phone, status    |
| Payment   | transaction | amount, currency, customer, status     |
| Form      | submission  | form, fields, submitter, submitted_at  |
| Support   | ticket      | subject, priority, requester, status   |

### 3. Workflow Engine

The workflow engine evaluates triggers after each sync event and executes matching workflows.

```
  Sync Event
       |
       v
  +-------------------+
  | Load all enabled  |
  | workflow defs     |
  +-------------------+
       |
       v
  For each workflow:
  +-------------------+     +-------------------+
  | Match trigger     | --> | Evaluate filters  |
  | type == event?    |     | connector? entity?|
  +-------------------+     | conditions?       |
       |                    +-------------------+
       | (match)                  |
       v                         v
  +-------------------+     +-------------------+
  | Execute actions   |     | Skip (no match)   |
  | sequentially      |     +-------------------+
  +-------------------+
       |
       v
  +-------------------+
  | Record execution  |
  | result + status   |
  +-------------------+
```

**Trigger types:** `sync_completed`, `sync_failed`, `new_record`, `error_threshold`

**Action types:** `create_log`, `send_notification`, `update_status`, `create_record`

**Condition operators:** `equals`, `not_equals`, `contains`, `greater_than`, `less_than`

### 4. Retry System with Exponential Backoff

```
  Failed Operation
       |
       v
  +------------------+
  | Add to queue     |
  | attempt = 0      |
  | delay = 30s      |
  +------------------+
       |
       v
  +------------------+     Success
  | Process queue    | ---------> Mark completed
  | (next_retry_at   |
  |  <= now)         |     Failure + attempts < max
  +------------------+ ---------> Reschedule
       |                          delay = [30s, 2m, 10m]
       |
       v  Failure + attempts >= max
  +------------------+
  | Mark failed      |
  | Log exhaustion   |
  +------------------+
```

### 5. Structured Logging

Every component writes to a centralized `LogEntry` table through a shared logger service.

```
  logger.info('pipeline', 'Sync completed', { syncRunId, recordCount })
       |
       v
  +------------------+
  | LogEntry         |
  |   level: info    |
  |   source: pipe.. |
  |   message: ...   |
  |   metadata: JSON |
  |   timestamp: now |
  +------------------+
       |
       v
  Dashboard: filterable by level (debug|info|warn|error)
                      and source (connector|pipeline|workflow|retry|system)
```

Sources: `connector`, `pipeline`, `workflow`, `system`, `retry`

### 6. Dashboard Structure

```
  +-----------------------------------------------------------+
  |  SIDEBAR              |  MAIN CONTENT                      |
  |                       |                                    |
  |  Dashboard       (/)  |  +------+ +------+ +------+ +---+ |
  |  Integrations   (/i)  |  | Stat | | Stat | | Stat | |Stat| |
  |  Workflows      (/w)  |  +------+ +------+ +------+ +---+ |
  |  Sync History   (/s)  |                                    |
  |  Logs           (/l)  |  +------------------+ +---------+  |
  |                       |  | Recent Syncs     | | Recent  |  |
  |                       |  | - name, status,  | | Activity|  |
  |                       |  |   records, time  | | - logs  |  |
  |                       |  +------------------+ +---------+  |
  +-----------------------------------------------------------+
```

**Dashboard stats cards:** Active Integrations, Sync Success Rate, Records Synced, Pending Retries

**Detail pages:** Integration detail (sync history, config, trigger sync button), Workflow detail (trigger config, action list, execution history)

---

## Data Model Overview

```
  Integration ---< SyncRun ---< NormalizedRecord
                       |
                       v
              WorkflowExecution >--- WorkflowDefinition

  LogEntry (standalone, written by all components)
  RetryQueue (standalone, fed by pipeline failures)
```

Seven tables total, with indexed foreign keys for performant queries on integration, sync run, status, and timestamp columns.
