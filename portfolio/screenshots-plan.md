# API Integration System -- Screenshots Plan

Capture each screen at 1440x900 in a Chromium-based browser with the sidebar visible. Use the seeded demo dataset so cards, tables, and charts are populated with realistic data.

---

## 1. Dashboard Overview

**Route:** `/`

**What to show:**
- All four stat cards populated: Active Integrations (3/4), Sync Success Rate (85%), Records Synced (120+), Pending Retries (1 or 2)
- Recent Sync Runs panel with 4-5 rows showing a mix of completed, partial, and failed statuses
- Recent Activity panel with a visible mix of info, warn, and error log entries
- Sidebar fully visible with all navigation items

**Best data state:**
Run 3-4 syncs before capturing so there is a healthy spread of statuses. Trigger one failed sync so Pending Retries is nonzero and the error log dot appears in the activity feed.

**Why this matters for the portfolio:**
This is the hero screenshot. It demonstrates at a glance that the system provides operational visibility -- stat cards, recent activity, and sync status all on one screen.

---

## 2. Integrations List

**Route:** `/integrations`

**What to show:**
- Four integration cards in a 2x2 grid: CRM (active), Payment (active), Form / Webhook (inactive), Support (error)
- Each card displaying the connector type icon, integration name, status badge, sync count, record count, and last sync timestamp
- Color-coded status badges: green for active, gray for inactive, red for error

**Best data state:**
Seed all four integrations. Run successful syncs on CRM and Payment. Leave Form as never-synced (inactive). Trigger a failed sync on Support to put it in error state.

**Why this matters for the portfolio:**
Shows the pluggable connector architecture and multi-integration management in a clean card layout.

---

## 3. Integration Detail -- Sync History

**Route:** `/integrations/[id]` (use the CRM integration)

**What to show:**
- Integration header with name, type, status badge, and last sync timestamp
- "Test Connection" and "Trigger Sync" action buttons
- Configuration section showing connector config key-value pairs
- Sync history table with 5+ rows: mix of completed, partial, and failed runs showing records processed, records failed, duration, and timestamps

**Best data state:**
Run 5-6 syncs against the CRM integration so the history table has variety. Include at least one partial and one failed run.

**Why this matters for the portfolio:**
Demonstrates the per-integration drill-down, the on-demand sync capability, and the full audit trail of every sync run.

---

## 4. Workflows Page with Execution Stats

**Route:** `/workflows`

**What to show:**
- Three summary stat cards at the top: Total Executions, Successful, Failed
- Workflow list below with 3-4 workflow cards, each showing: name, enabled/disabled badge, trigger type label (e.g., "On Sync Complete"), execution count, and the 2-3 most recent execution status badges inline
- At least one workflow should be disabled to show the gray "Disabled" badge contrast

**Best data state:**
Seed 3-4 workflows. Run several syncs to generate 8-10 workflow executions. Disable one workflow before capturing.

**Why this matters for the portfolio:**
Shows the event-driven automation layer and that the system tracks execution history per workflow.

---

## 5. Workflow Detail -- Trigger Config and Actions

**Route:** `/workflows/[id]` (use "Sync Completion Logger" or similar)

**What to show:**
- Workflow header with name, description, and enabled status
- Trigger configuration section: trigger type, connector type filter, entity type filter, any custom conditions
- Actions list showing the configured action sequence (e.g., create_log, send_notification)
- "Execute Manually" button
- Execution history table with 4-5 rows showing status, start time, duration, and linked sync run ID

**Best data state:**
Pick a workflow with both a connector filter and at least one condition so the trigger config section is visually rich. Run it manually once in addition to automated runs.

**Why this matters for the portfolio:**
Demonstrates the configurable automation engine -- trigger types, filters, conditions, and chained actions.

---

## 6. Logs Page with Filters Active

**Route:** `/logs`

**What to show:**
- Level filter bar with "warn" selected (highlighted button)
- Source filter bar with "pipeline" selected (highlighted button)
- Filtered log list showing 5-10 warn-level entries from the pipeline source
- At least one log entry expanded to show its JSON metadata block (integration ID, sync run ID, record counts)
- Timestamp, level badge, source badge, and message all visible in each row

**Best data state:**
Generate enough activity (10+ syncs across integrations) so the unfiltered log has 40-50 entries. Then apply the warn + pipeline filters to show a focused subset. Ensure at least one entry has meaningful metadata.

**Why this matters for the portfolio:**
Shows structured, queryable logging with real-time filtering -- a key operational feature for production systems.

---

## 7. Sync History Timeline

**Route:** `/sync-history`

**What to show:**
- Full sync history table spanning all integrations
- Columns: integration name, connector type, status badge, records processed, records failed, started at, duration
- 10-15 rows with a visible mix of completed, partial, and failed statuses across different connector types
- Sorted by most recent first

**Best data state:**
Run 3-4 syncs on each of the four integrations to build up 12-16 sync run rows. Timing should be spread across the last hour so timestamps look natural.

**Why this matters for the portfolio:**
Provides the cross-integration audit view -- a single timeline of every data sync the system has performed.

---

## Capture Checklist

| # | Screen                        | Route                    | Filename                       |
|---|-------------------------------|--------------------------|--------------------------------|
| 1 | Dashboard overview            | `/`                      | `01-dashboard-overview.png`    |
| 2 | Integrations list             | `/integrations`          | `02-integrations-list.png`     |
| 3 | Integration detail            | `/integrations/[id]`     | `03-integration-detail.png`    |
| 4 | Workflows page                | `/workflows`             | `04-workflows-page.png`        |
| 5 | Workflow detail               | `/workflows/[id]`        | `05-workflow-detail.png`       |
| 6 | Logs with filters             | `/logs`                  | `06-logs-filtered.png`         |
| 7 | Sync history timeline         | `/sync-history`          | `07-sync-history.png`          |

**Format:** PNG, 1440x900, 2x DPI if on a Retina display. Crop browser chrome if desired.
