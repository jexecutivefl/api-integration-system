# Parallel Execution Plan

## Stream Ownership Map

| Stream | Owned Folders | Owned Files |
|--------|--------------|-------------|
| A — Connectors | `src/connectors/` | All files in connectors/ |
| B — Normalization | `src/lib/normalization/` | normalizer.ts, validator.ts, pipeline.ts, mappers/* |
| C — Workflows | `src/workflows/` | engine.ts, triggers.ts, actions/* |
| D — Dashboard UI | `src/components/dashboard/`, `src/app/(dashboard)/` pages | All dashboard components and pages |
| E — Observability | `src/lib/logger.ts`, `src/lib/retry.ts` | Logger, retry manager |

## Shared Files (Must Not Be Edited Concurrently)

| File | Owner | Consumers |
|------|-------|-----------|
| `src/lib/types.ts` | Phase 0 (locked after) | All streams |
| `src/lib/db.ts` | Phase 1 (locked after) | All streams |
| `src/server/api-helpers.ts` | Phase 1 (locked after) | All API routes |
| `prisma/schema.prisma` | Phase 1 (locked after) | All streams |
| `src/components/ui/*` | Phase 1 (locked after) | Stream D |
| `src/app/layout.tsx` | Phase 1 (locked after) | Stream D |

## Dependency Graph

```
Phase 0 (types, docs)
    │
    ▼
Phase 1 (scaffold, DB, UI base)
    │
    ├──► Stream A (connectors) ────────────────┐
    ├──► Stream B (normalization) ──────────────┤
    ├──► Stream C (workflows) ──────────────────┤
    ├──► Stream D (dashboard UI) ───────────────┤
    └──► Stream E (observability) ──────────────┤
                                                │
                                                ▼
                                        Phase 3 (integration)
                                                │
                                                ▼
                                        Phase 4-6 (polish)
```

## Rules

1. Streams A-E may run in parallel after Phase 1 is complete
2. Each stream creates files only within its owned folders
3. Shared files are read-only during Phase 2
4. API routes are created by the stream that owns the business logic
5. Phase 3 integration is the only phase that connects cross-stream code
