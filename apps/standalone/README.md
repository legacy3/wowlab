# Standalone Simulation CLI

A standalone CLI application for running WoW Lab simulations using the `@wowlab/*` packages.

## Purpose

This app provides a lightweight environment to:

- Develop and test rotations in isolation.
- Verify simulation mechanics.
- Debug Effect-TS service integration.
- Run a simulation daemon for distributed computing.

## Setup

```bash
# Install dependencies (from repo root)
pnpm install

# Run the default rotation (Beast Mastery)
pnpm dev run

# Run a specific rotation
pnpm dev run beast-mastery
```

## Commands

### `run` - Run Simulations

Run simulations locally or on a remote daemon.

```bash
# Run locally with default settings
pnpm start run beast-mastery

# Run 1000 iterations with 8 workers
pnpm start run beast-mastery -n 1000 -w 8

# Run on a remote server
pnpm start run beast-mastery -n 10000 --server http://192.168.1.100:3847
```

**Options:**

- `-d, --duration` - Simulation duration in seconds (default: 60)
- `-n, --iterations` - Number of simulations to run (default: 1)
- `-w, --workers` - Worker threads (0=single-threaded, -1=auto)
- `-b, --batch-size` - Simulations per worker batch (default: 100)
- `-s, --server` - Remote daemon URL for distributed execution

### `daemon` - Start Simulation Server

Start an RPC server that handles simulation requests. Useful for distributed computing or containerized deployments.

```bash
# Start daemon on default port
pnpm start daemon

# Start on custom port
pnpm start daemon --port 8080 --host 0.0.0.0
```

**Options:**

- `-p, --port` - Port to listen on (default: 3847)
- `-h, --host` - Host to bind to (default: 0.0.0.0)

## Docker Deployment

Build and run the daemon in a container. **Build from the repo root** since this is a monorepo:

```bash
# Build the image (from repo root!)
docker build -f apps/standalone/Dockerfile -t wowlab-daemon .

# Run the container
docker run -p 3847:3847 wowlab-daemon

# With custom port
docker run -p 8080:8080 wowlab-daemon daemon --port 8080

# Override Supabase credentials (optional - defaults are baked in)
docker run -p 3847:3847 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-key \
  wowlab-daemon
```

Then run simulations against it from anywhere:

```bash
pnpm start run --server http://your-server:3847 --iterations 100000 beast-mastery
```

## Architecture

- **CLI**: Built with `@effect/cli`.
- **RPC**: Uses `@effect/rpc` for client-server communication.
- **Framework**: Uses a modular runner (`src/framework/runner.ts`) to set up the simulation environment.
- **Rotations**: Rotations are defined in `src/rotations/` and implement the `RotationDefinition` interface.
- **Packages**: Consumes `@wowlab/core`, `@wowlab/rotation`, `@wowlab/runtime`, and `@wowlab/services`.

## Adding a New Rotation

1. Create a new file in `src/rotations/` (e.g., `my-spec.ts`).
2. Implement the `RotationDefinition` interface.
3. Register it in `src/rotations/index.ts`.
4. Run it with `pnpm dev run my-spec`.
