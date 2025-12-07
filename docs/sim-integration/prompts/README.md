# Simulation Integration - Implementation Prompt

**One prompt. Client-side simulation.**

The portal already has client-side spell data loading (see data inspector). This just wires the existing simulation logic to run in the browser.

## The Prompt

**[client-sim-prompt.md](./client-sim-prompt.md)** - Everything needed to run simulations client-side

## What It Does

1. Load spells using existing `createPortalDbcLayer` (60-day IndexedDB cache)
2. Create Effect runtime in browser (adapted from standalone)
3. Run simulation loop (same logic as CLI)
4. Display results in existing timeline/chart components

## No Server Required

- No API routes
- No job managers
- No SSE streaming
- No database persistence (for now)

Just client-side Effect-TS, same as the data inspector already does.
