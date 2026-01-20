# node-headless

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

Headless simulation node for servers and Docker deployments.

## Commands

```bash
cargo build --release
./target/release/node-headless --help

# Run node
./target/release/node-headless run

# Check for updates
./target/release/node-headless update
```

## Docker

```bash
docker build -t wowlab-node .
docker run -d wowlab-node
```

## Architecture

Minimal binary that runs `NodeCore` from the `node` library without any GUI. Designed for:

- Server deployments
- Docker containers
- Headless Linux machines
- CI/CD simulation workers

## Features

- Signal handling (SIGINT/SIGTERM)
- Structured logging to stdout
- Auto-update support
- Minimal resource footprint

## Dependencies

- `node` - Core node functionality
- `tokio` - Async runtime
- `ctrlc` - Signal handling
- `clap` - CLI parsing
