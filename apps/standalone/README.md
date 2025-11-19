# Standalone Simulation Test App

A standalone Node.js application for testing the WowLab simulation library (`@packages/innocent-*`) in isolation.

## Purpose

This app exists to test and debug the simulation library integration without the complexity of the Next.js portal app. It provides a simple environment to:

- Test layer composition
- Debug Effect-TS service integration
- Verify simulation execution
- Troubleshoot metadata service implementations

## Setup

```bash
# Install dependencies (from repo root)
pnpm install

# Run in development mode
cd apps/standalone
pnpm dev

# Build and run production
pnpm build
pnpm start
```

## What It Does

The app runs a simple 10-second Fire Mage simulation with:

- **Player unit**: Level 80 Mage with Fire Blast (108853) and Scorch (2948)
- **Enemy unit**: Training dummy with 1M HP
- **Rotation**: Cast Fire Blast → Scorch
- **Event collection**: Captures all simulation events and state snapshots

## Architecture

- Uses `@packages/innocent-bootstrap/Layers` for layer composition
- Creates a minimal metadata service (stubbed for standalone mode)
- Demonstrates proper Effect service usage and error handling
- Shows how to subscribe to simulation events and snapshots

## Output

On success, you'll see:

```
============================================================
WowLab Standalone Simulation Test
============================================================
Starting simulation...
Loading spells: 108853, 2948
Loaded 2 spells successfully
Adding units to state
Getting rotation context
Subscribing to simulation events
Starting simulation run (10s)
Executing rotation
Simulation complete. Snapshots: X, Events: Y
============================================================
✅ SUCCESS
{
  "snapshots": X,
  "events": Y,
  "success": true
}
```

On failure, you'll see detailed Effect error traces with causes and defects.
