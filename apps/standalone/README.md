# Standalone Simulation CLI

A standalone CLI application for running WowLab simulations using the `@wowlab/*` packages.

## Purpose

This app provides a lightweight environment to:

- Develop and test rotations in isolation.
- Verify simulation mechanics.
- Debug Effect-TS service integration.

## Setup

```bash
# Install dependencies (from repo root)
pnpm install

# Run the default rotation (Fire Mage)
pnpm dev run

# Run a specific rotation
pnpm dev run fire-mage
```

## Architecture

- **CLI**: Built with `@effect/cli`.
- **Framework**: Uses a modular runner (`src/framework/runner.ts`) to set up the simulation environment.
- **Rotations**: Rotations are defined in `src/rotations/` and implement the `RotationDefinition` interface.
- **Packages**: Consumes `@wowlab/core`, `@wowlab/rotation`, `@wowlab/runtime`, and `@wowlab/services`.

## Adding a New Rotation

1. Create a new file in `src/rotations/` (e.g., `my-spec.ts`).
2. Implement the `RotationDefinition` interface.
3. Register it in `src/rotations/index.ts`.
4. Run it with `pnpm dev run my-spec`.
