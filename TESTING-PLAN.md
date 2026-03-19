# Testing Plan: API Integration System — Portfolio Readiness

## Context
You want to run and manually test every feature of your API Integration System before showcasing it on your Upwork portfolio. This plan walks you through setup, then systematically tests every page, API endpoint, and feature so you can confirm the app is demo-worthy.

---

## Phase 1: Setup & Launch

1. **Install dependencies & initialize database**
   ```bash
   cd /home/user/api-integration-system
   npm install
   cp .env.example .env
   npx prisma migrate dev
   npm run db:seed
   ```
2. **Start the dev server**
   ```bash
   npm run dev
   ```
3. **Open browser** → `http://localhost:3000`

**Pass criteria:** Server starts without errors, homepage loads.

---

## Phase 2: Dashboard (`/`)

- [ ] Page loads with 4 stat cards (Active Integrations, Sync Success Rate, Total Records, Pending Retries)
- [ ] Stats show non-zero values from seed data
- [ ] Recent Sync Runs section shows entries with status badges (completed/failed/partial)
- [ ] Activity log section shows recent log entries
- [ ] Sidebar navigation links all work (Integrations, Workflows, Logs, Sync History)

---

## Phase 3: Integrations (`/integrations`)

### 3a. List Page
- [ ] All 4 seeded integrations appear (CRM, Payment, Form, Support)
- [ ] Status badges display correctly (active/inactive/error)
- [ ] Search/filter works if present
- [ ] Click through to detail page for each integration

### 3b. Detail Page (`/integrations/[id]`)
- [ ] Integration name, type, status, config, last sync time display correctly
- [ ] Sync history for that integration is shown

### 3c. API — Create Integration
```bash
curl -X POST http://localhost:3000/api/integrations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test CRM","type":"crm","config":{"apiKey":"test123","baseUrl":"https://example.com"}}'
```
- [ ] Returns `{ success: true, data: { id: "...", ... } }`
- [ ] New integration appears on the list page

### 3d. API — Test Connection
```bash
curl -X POST http://localhost:3000/api/integrations/<id>/test
```
- [ ] Returns success or simulated failure (10% failure rate is expected)

### 3e. API — Trigger Sync
```bash
curl -X POST http://localhost:3000/api/integrations/<id>/sync
```
- [ ] Returns sync run result with `recordsProcessed` and `recordsFailed` counts
- [ ] New sync run appears in sync history
- [ ] Dashboard stats update after sync

### 3f. API — Update & Delete
```bash
# Update
curl -X PUT http://localhost:3000/api/integrations/<id> \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","status":"inactive"}'

# Delete
curl -X DELETE http://localhost:3000/api/integrations/<id>
```
- [ ] Update changes reflected on detail page
- [ ] Delete removes integration from list

---

## Phase 4: Data Sync Pipeline

- [ ] Trigger syncs on each integration type (CRM, Payment, Form, Support)
- [ ] Verify each sync creates a `SyncRun` record (check `/api/sync-runs`)
- [ ] Verify `NormalizedRecord` entries are created with correct `entityType`:
  - CRM → `contact`
  - Payment → `transaction`
  - Form → `submission`
  - Support → `ticket`
- [ ] Run multiple syncs — confirm some show `partial` or `failed` status (due to 10% mock failure rate)
- [ ] Check sync run detail: `GET /api/sync-runs/<id>` shows record counts and errors

---

## Phase 5: Workflows (`/workflows`)

### 5a. List Page
- [ ] Seeded workflows appear with name, trigger type, enabled status
- [ ] Execution count shown per workflow

### 5b. Create Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Log on Sync Complete",
    "description":"Creates a log entry when any sync completes",
    "triggerType":"sync_completed",
    "triggerConfig":{"conditions":[]},
    "actions":[{"type":"create_log","config":{"level":"info","message":"Sync completed successfully"}}],
    "enabled":true
  }'
```
- [ ] Workflow created successfully
- [ ] Appears on workflows list page

### 5c. Manual Execute
```bash
curl -X POST http://localhost:3000/api/workflows/<id>/execute
```
- [ ] Returns execution result
- [ ] Execution appears in `/api/workflow-executions`

### 5d. Workflow Detail Page (`/workflows/[id]`)
- [ ] Shows trigger configuration, actions list, execution history

### 5e. Auto-trigger Test
- [ ] Trigger a sync → check if workflows with `sync_completed` trigger fire automatically
- [ ] Verify execution entry created in workflow executions

---

## Phase 6: Logs (`/logs`)

- [ ] Log viewer page loads with entries
- [ ] Filter by level (debug, info, warn, error) — each filter works
- [ ] Filter by source (connector, pipeline, workflow, system, retry) — each works
- [ ] Search text filter works
- [ ] Logs from recent syncs and workflow executions appear
- [ ] API: `GET /api/logs?level=error` returns only error-level logs

---

## Phase 7: Sync History (`/sync-history`)

- [ ] Timeline view shows all sync runs across integrations
- [ ] Each entry shows integration name, status, record counts, timestamp
- [ ] Status badges render correctly (completed = green, failed = red, partial = yellow, running = blue)

---

## Phase 8: Retry Queue

```bash
# View retry queue
curl http://localhost:3000/api/retry-queue

# Process all pending retries
curl -X POST http://localhost:3000/api/retry-queue/process

# Retry a single item
curl -X POST http://localhost:3000/api/retry-queue/<id>/retry
```
- [ ] Retry queue shows items after failed syncs
- [ ] Processing retries changes their status
- [ ] Individual retry works

---

## Phase 9: Error Handling & Edge Cases

- [ ] Create integration with missing required fields → returns validation error
- [ ] GET non-existent integration ID → returns 404
- [ ] Delete already-deleted integration → returns 404
- [ ] Sync an inactive integration → verify behavior (should it error or skip?)
- [ ] Rapid consecutive syncs on same integration → no crashes or data corruption

---

## Phase 10: UI/UX Polish Check

- [ ] All pages have consistent styling (Tailwind)
- [ ] Sidebar highlights current page
- [ ] No broken links or dead navigation
- [ ] No console errors in browser DevTools
- [ ] Page transitions feel smooth
- [ ] Empty states handled gracefully (e.g., no workflows → shows appropriate message)
- [ ] Responsive layout works at common breakpoints (check at 1280px, 768px widths)

---

## Phase 11: Build & Lint

```bash
npm run lint        # Should pass with no errors
npm run build       # Production build should succeed
npm run start       # Production server should work
```
- [ ] Lint passes cleanly
- [ ] Build completes without errors
- [ ] Production server serves the app correctly at `http://localhost:3000`

---

## Phase 12: Database Explorer (Optional)

```bash
npx prisma studio
```
- [ ] Opens at `http://localhost:5555`
- [ ] Browse all 7 tables and verify data looks correct
- [ ] Useful for debugging if any tests above show unexpected results

---

## Key Files to Watch for Issues

| Area | File |
|------|------|
| Database schema | `prisma/schema.prisma` |
| Seed data | `prisma/seed.ts` |
| API helpers | `src/server/api-helpers.ts` |
| Sync pipeline | `src/lib/normalization/pipeline.ts` |
| Workflow engine | `src/workflows/engine.ts` |
| Connectors | `src/connectors/*.ts` |
| Dashboard page | `src/app/page.tsx` |

---

## Verification Summary

After completing all phases:
1. Every API endpoint returns proper responses
2. All UI pages render correctly with real data
3. Sync pipeline processes data end-to-end across all 4 connector types
4. Workflows trigger and execute actions
5. Logs capture activity throughout the system
6. Retry queue handles failures gracefully
7. Build and lint pass cleanly
8. No console errors or broken UI elements

If all checks pass, the app is portfolio-ready.
