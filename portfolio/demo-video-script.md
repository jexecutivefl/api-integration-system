# API Integration System -- Demo Video Script

**Target duration:** 60-90 seconds
**Format:** Screen recording with voiceover (or text captions)
**Resolution:** 1440x900 minimum
**Prerequisite:** Run the seed script and trigger 3-4 syncs beforehand so the dashboard has data.

---

## Pre-recording Setup

1. Run `npm run db:seed` to populate integrations, workflows, and initial data.
2. Open the app at `http://localhost:3000`.
3. Trigger 3-4 syncs from the Integrations page so the dashboard, logs, and sync history are populated.
4. Ensure at least one sync has failed so retry and error states are visible.

---

## Script

### Scene 1: Dashboard Overview (0:00 - 0:15)

**[Show: Dashboard at `/`]**

> "This is the API Integration System -- a full-stack platform I built to centralize and automate third-party data syncs."

- Point out the anomaly detection banner at the top if visible.
- Hover over the four stat cards with trend indicators: Active Integrations, Sync Success Rate, Records Synced, Pending Retries.
- Show the Sync Activity bar chart and the AI Insights panel with its animated recommendations.
- Briefly gesture at the live activity feed with the green "Live" indicator.

> "The dashboard gives the operations team an instant snapshot with AI-powered insights: sync health, trend analysis, anomaly detection, and actionable recommendations -- all in real-time."

---

### Scene 2: Integrations Page (0:15 - 0:30)

**[Navigate: Click "Integrations" in the sidebar]**

> "The system manages four connector types -- CRM, Payment, Form, and Support -- each with its own status and sync history."

- Show the search bar and type filter pills.
- Click "Add Integration" to show the modal form, then close it.
- Point out the four integration cards with their status badges (active, inactive, error).
- Click into the CRM integration card.

**[Show: Integration detail at `/integrations/[id]`]**

> "Each integration has a detail view showing its configuration, connection test, and a full history of every sync run -- including records processed, failures, and duration."

---

### Scene 3: Trigger a Sync (0:30 - 0:45)

**[Action: Click the "Sync Now" button on the CRM integration detail page]**

> "I can trigger a sync on demand. The system fetches data from the external API, validates every record against the entity schema, normalizes it into a canonical format, and persists the results."

- Wait for the sync to complete -- notice the toast notification appearing in the bottom-right corner.
- Point out the AI-powered "Recommended Actions" section with smart suggestions.
- Point out the new row in the sync history table with its status, record count, and timestamp.

> "This run pulled 8 contacts, validated them, and stored them as normalized records. Notice the AI recommendations suggesting optimal sync timing and incremental sync opportunities."

---

### Scene 4: Sync History (0:45 - 0:55)

**[Navigate: Click "Sync History" in the sidebar]**

> "The sync history page gives a cross-integration timeline of every sync run, with status, connector type, and record counts at a glance."

- Scroll through the table briefly showing rows from multiple connector types with different statuses (completed, partial, failed).

---

### Scene 5: Workflow Execution (0:55 - 1:10)

**[Navigate: Click "Workflows" in the sidebar]**

> "The workflow engine triggers automations based on sync events. Each workflow has a trigger type, optional filters, and a sequence of actions."

- Point out the execution stat cards (Total, Successful, Failed).
- Click into a workflow (e.g., "Sync Completion Logger").

**[Show: Workflow detail at `/workflows/[id]`]**

> "This workflow fires on every successful CRM sync. It runs two actions: it creates an audit log entry and sends a notification. You can see the full execution history here, including which sync run triggered each execution."

---

### Scene 6: Logs (1:10 - 1:25)

**[Navigate: Click "Logs" in the sidebar]**

> "Every operation is captured in the structured log. I can filter by level and source to isolate exactly what I need."

- Click the "warn" level filter button.
- Click the "pipeline" source filter button.
- Point out the filtered results.

> "Here I have filtered to warn-level pipeline events -- these show records that failed validation during a sync. Each log entry includes JSON metadata with the integration ID, sync run ID, and error details."

- Click on a log entry to show its expanded metadata.

---

### Scene 7: Wrap-up (1:25 - 1:30)

**[Navigate: Return to Dashboard]**

> "The API Integration System: pluggable connectors, a validated normalization pipeline, event-driven workflows, AI-powered insights, automatic retries, and full observability -- all in a polished, production-grade dashboard."

---

## Recording Tips

- Keep mouse movements deliberate and smooth; avoid rapid scrolling.
- Pause for 1-2 seconds on each major screen before speaking about it.
- If using voiceover, record audio separately and sync in post for cleaner quality.
- If using text captions instead, place them at the bottom of the screen in a semi-transparent bar.
- Export at 1080p minimum, 30fps, MP4 format.
