# WoW Lab Sentinel

Distributed task scheduler and monitoring service. Coordinates simulation workload across compute nodes, provides Discord commands for monitoring, and exposes health/metrics endpoints.

## Running

Requires `DISCORD_TOKEN` and `SUPABASE_DB_URL` in `.env`.

```bash
cargo build --release
./target/release/sentinel
```

Starts three concurrent services:
- **Discord Bot** — maintains per-guild Bloom filters for membership-based access control, monitors guild events to keep filters current, slash commands for monitoring
- **Scheduler** — PG LISTEN/NOTIFY chunk assignment + stale reclamation
- **HTTP** — port 8080 (`/status`, `/metrics`)

## How Scheduling Works

1. Listens for `pending_chunk` notifications from Postgres
2. Matches chunks to eligible nodes by capacity and access permissions
3. Uses Bloom filters for Discord guild membership checks
4. Reclaims chunks from nodes offline >60s
