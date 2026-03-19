# API Integration System

A centralized platform for connecting, normalizing, and orchestrating data across multiple external APIs. Provides a unified dashboard for monitoring integration health, managing workflow automations, tracking sync history, and handling errors with built-in retry logic.

## Problem Solved

Organizations using multiple SaaS tools face fragmented data, manual sync processes, invisible failures, and no automated response to data events. This system solves those problems by providing:

- **Unified data pipeline** — connects to CRM, Payment, Form, and Support APIs through a pluggable connector architecture
- **Automatic normalization** — transforms heterogeneous API responses into a standardized internal data model
- **Workflow automation** — triggers rule-based actions when data events occur (sync completion, new records, failures)
- **Operational visibility** — structured logging, error tracking, and retry management in a single dashboard

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Dashboard (Next.js)                     │
│  Overview │ Integrations │ Workflows │ Logs │ History    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 API Layer (Route Handlers)               │
└───┬────────────────────┬────────────────────┬───────────┘
    │                    │                    │
┌───▼───┐  ┌─────────────▼──────────┐  ┌─────▼─────────┐
│Connectors│ │   Workflow Engine     │  │ Observability │
│ CRM     │ │  Triggers + Actions   │  │ Logger + Retry│
│ Payment │ │  Execution History    │  │ Error Store   │
│ Form    │ └──────────────────────┘  └───────────────┘
│ Support │
└───┬─────┘
    │
┌───▼───────────────────────────────────────────────────┐
│            Normalization Pipeline                      │
│  Fetch → Validate → Map → Normalize → Persist         │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│              Database (SQLite + Prisma)                │
└───────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers (API routes) |
| Database | SQLite + Prisma ORM |
| Architecture | REST API, connector pattern, pipeline architecture |

## Features

- **Multi-API Connector Framework** — Pluggable adapter pattern with CRM, Payment, Form, and Support connectors
- **Data Normalization Pipeline** — Validates, maps, and normalizes heterogeneous API data into a common model
- **Workflow Automation Engine** — Rule-based triggers (`sync_completed`, `sync_failed`, `new_record`, `error_threshold`) with configurable actions
- **Retry System** — Exponential backoff (30s → 2min → 10min) with configurable max attempts
- **Structured Logging** — Filterable by level (debug/info/warn/error) and source (connector/pipeline/workflow/system/retry)
- **Dashboard** — Overview stats, integration management, workflow monitoring, log viewer, sync timeline
- **Demo-Ready** — Seeded with realistic data across all 4 integrations including success, failure, and partial sync scenarios

## Setup

```bash
# Clone and install
git clone <repo-url>
cd api-integration-system
npm install

# Configure environment
cp .env.example .env

# Set up database
npx prisma migrate dev
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/               # REST API endpoints
│   ├── integrations/      # Integration list + detail pages
│   ├── workflows/         # Workflow list + detail pages
│   ├── logs/              # Log viewer page
│   └── sync-history/      # Sync timeline page
├── components/
│   └── ui/                # Reusable components (Card, Badge, Table, Button, Sidebar)
├── connectors/            # API connector adapters
│   ├── base.ts            # Connector interface + abstract base
│   ├── crm.ts             # CRM connector (contacts, deals)
│   ├── payment.ts         # Payment connector (transactions)
│   ├── form.ts            # Form/webhook connector (submissions)
│   ├── support.ts         # Support ticket connector
│   └── registry.ts        # Connector registry
├── lib/
│   ├── normalization/     # Data normalization pipeline
│   │   ├── pipeline.ts    # Orchestrator: fetch → validate → normalize → persist
│   │   ├── normalizer.ts  # Mapper dispatcher
│   │   ├── validator.ts   # Record validation rules
│   │   └── mappers/       # Per-connector data mappers
│   ├── logger.ts          # Structured logging to database
│   ├── retry.ts           # Retry queue with exponential backoff
│   ├── types.ts           # Core TypeScript type definitions
│   ├── db.ts              # Prisma client singleton
│   └── config.ts          # Environment config loader
├── workflows/
│   ├── engine.ts          # Workflow evaluation + execution engine
│   ├── triggers.ts        # Trigger condition evaluation
│   └── actions/           # Action implementations (log, notify, update, create)
└── server/
    └── api-helpers.ts     # API response helpers + error wrapper
```

## Demo Scenarios

### 1. Successful CRM Sync
Trigger a sync on the Salesforce CRM integration → contacts are fetched, validated, normalized, and stored → "Log Successful Syncs" and "New Contact Processing" workflows fire automatically.

### 2. Failed Support Sync with Retry
The Zendesk Support integration has an authentication error → sync fails → "Alert on Sync Failure" workflow fires → failed sync is added to retry queue with exponential backoff.

### 3. Payment Sync with Partial Results
Stripe Payment sync processes most records but hits a rate limit → sync completes with "partial" status → some records are flagged as failed → visible in sync history with error details.

## API Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/integrations` | GET, POST | List/create integrations |
| `/api/integrations/[id]` | GET, PUT, DELETE | Manage single integration |
| `/api/integrations/[id]/sync` | POST | Trigger data sync |
| `/api/integrations/[id]/test` | POST | Test connection |
| `/api/sync-runs` | GET | List sync run history |
| `/api/workflows` | GET, POST | List/create workflows |
| `/api/workflows/[id]/execute` | POST | Manual workflow trigger |
| `/api/logs` | GET | Query structured logs |
| `/api/retry-queue` | GET | View retry queue |
| `/api/retry-queue/process` | POST | Process pending retries |
| `/api/dashboard/stats` | GET | Dashboard statistics |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:seed      # Seed demo data
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
```

## Portfolio Value

This project demonstrates expertise in:
- **API integration architecture** — pluggable connector pattern with typed interfaces
- **Data pipeline engineering** — validation, normalization, and persistence workflows
- **Workflow automation** — event-driven rule engine with configurable triggers and actions
- **Error handling & resilience** — retry queues, exponential backoff, failure tracking
- **Full-stack development** — Next.js, TypeScript, Prisma, Tailwind, REST API design
- **Production-minded engineering** — structured logging, observability, clean architecture
