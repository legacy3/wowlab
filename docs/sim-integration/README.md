# Simulation Integration Plan

> Integrating the WoW simulation engine from `apps/standalone` into `apps/portal`

## Executive Summary

This document set provides a comprehensive plan for bringing actual simulation capabilities to the portal web application. Currently, the portal uses mock data for simulation results. The standalone CLI app has a fully working simulation engine.

**Goal:** Run real simulations from the portal UI, with live progress updates and persisted results.

---

## Current State

| Component         | Status                                                         |
| ----------------- | -------------------------------------------------------------- |
| `apps/standalone` | Full simulation engine with worker threads, can run 100k+ sims |
| `apps/portal`     | UI complete with mock data, needs real simulation integration  |
| `packages/*`      | Shared Effect-TS services used by standalone                   |

---

## Phase Overview

| Phase | Description                                        | Complexity | Dependencies |
| ----- | -------------------------------------------------- | ---------- | ------------ |
| **0** | [Current State Analysis](./00-current-state.md)    | -          | None         |
| **1** | [Runtime Extraction](./01-runtime-extraction.md)   | Medium     | Phase 0      |
| **2** | [API Layer](./02-api-layer.md)                     | Medium     | Phase 1      |
| **3** | [Portal Wiring](./03-portal-wiring.md)             | Medium     | Phase 2      |
| **4** | [Streaming & Progress](./04-streaming-progress.md) | High       | Phase 3      |
| **5** | [Persistence & Polish](./05-persistence-polish.md) | Medium     | Phase 4      |

**Supplementary:** [User Flow Trace](./user-flow-trace.md) - Complete trace from /simulate to results

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        apps/portal (Next.js)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌──────────────────────────────────────┐  │
│  │   /simulate     │     │          API Routes                  │  │
│  │   UI Components │────▶│  POST /api/simulations               │  │
│  │                 │     │  GET  /api/simulations/[id]          │  │
│  │  QuickSimContent│     │  GET  /api/simulations/[id]/stream   │  │
│  │  ResultTabs     │◀────│  DELETE /api/simulations/[id]        │  │
│  │  Timeline       │ SSE │                                      │  │
│  │  Charts         │     └──────────────┬───────────────────────┘  │
│  └─────────────────┘                    │                          │
│                                         ▼                          │
│                          ┌──────────────────────────────────────┐  │
│                          │          JobManager                  │  │
│                          │  - Job lifecycle                     │  │
│                          │  - Progress streaming                │  │
│                          │  - Result transformation             │  │
│                          └──────────────┬───────────────────────┘  │
└─────────────────────────────────────────┼───────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    @wowlab/sim-engine (NEW)                         │
├─────────────────────────────────────────────────────────────────────┤
│  SimulationRuntime  │  SpellLoader  │  RotationRegistry            │
│  runSimulation()    │  loadSpells() │  getRotation()               │
│  runBatch()         │               │  BeastMasteryRotation        │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Existing Packages                              │
├─────────────────────────────────────────────────────────────────────┤
│  @wowlab/core       │  @wowlab/services  │  @wowlab/rotation       │
│  @wowlab/runtime    │  @wowlab/specs     │                          │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Supabase                                     │
├─────────────────────────────────────────────────────────────────────┤
│  spell DBC tables   │  simulation_jobs   │  rotation_sim_results   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions

### 1. Server-Side Execution

Run simulations on the server (API routes), not in the browser. Effect-TS runtime stays server-side.

**Rationale:**

- Effect layers expect single `Effect.provide` tree
- Heavy computation better suited for server
- Spell data access via Supabase server client
- Future: distribute to worker daemon

### 2. SSE for Progress

Use Server-Sent Events (not WebSocket) for streaming progress.

**Rationale:**

- Simpler than WebSocket for unidirectional data
- Native browser support via `EventSource`
- Works with standard HTTP infrastructure
- Easy to implement in Next.js API routes

### 3. New Package for Shared Runtime

Extract simulation runtime to `@wowlab/sim-engine` package.

**Rationale:**

- Avoid duplicating code between standalone and portal
- Clear separation of concerns
- Easier testing and maintenance
- Both apps import same logic

### 4. In-Memory Job State with Database Backup

Jobs stored in memory for fast access, persisted to Supabase for recovery.

**Rationale:**

- Low latency for progress updates
- Survives server restarts
- Audit trail of all simulations
- Enables history/comparison features

---

## Success Metrics

| Metric                    | Target                        |
| ------------------------- | ----------------------------- |
| Single sim latency        | < 2s for 60s fight            |
| Batch throughput          | 1000 iterations/minute        |
| Progress update frequency | 10 updates/second             |
| Results persistence       | 100% saved to DB              |
| Error recovery            | Jobs marked failed on restart |

---

## Risk Mitigation

| Risk                               | Mitigation                       |
| ---------------------------------- | -------------------------------- |
| Server crashes during sim          | Graceful shutdown + job recovery |
| SSE connection drops               | Reconnection with retry          |
| Memory pressure from large batches | Batch processing with cleanup    |
| Rate limit abuse                   | Per-user rate limiting           |
| Slow spell data loading            | 5-minute cache                   |

---

## Out of Scope

- Distributed execution across multiple servers
- Client-side simulation (keep server-side)
- Real-time multiplayer features
- Mobile app

---

## Getting Started

1. Read [Phase 0: Current State Analysis](./00-current-state.md) to understand what exists
2. Review [User Flow Trace](./user-flow-trace.md) for the target experience
3. Implement phases in order (each depends on previous)

---

## Document Index

1. **[Phase 0: Current State Analysis](./00-current-state.md)**
   - Standalone app architecture
   - Portal app architecture
   - Gap analysis

2. **[Phase 1: Runtime Extraction](./01-runtime-extraction.md)**
   - Create `@wowlab/sim-engine` package
   - Extract RotationRuntime, SpellLoader, rotations
   - Update standalone to use new package

3. **[Phase 2: API Layer](./02-api-layer.md)**
   - Create `/api/simulations` routes
   - Implement JobManager
   - Result transformation

4. **[Phase 3: Portal Wiring](./03-portal-wiring.md)**
   - Create React hooks for API
   - Update QuickSimContent
   - Wire results page to real data

5. **[Phase 4: Streaming & Progress](./04-streaming-progress.md)**
   - SSE stream implementation
   - Real-time progress updates
   - Partial results preview

6. **[Phase 5: Persistence & Polish](./05-persistence-polish.md)**
   - Database schema updates
   - Simulation history
   - Rate limiting & observability

7. **[User Flow Trace](./user-flow-trace.md)**
   - Complete user journey
   - Component trees at each step
   - Data flow diagrams
