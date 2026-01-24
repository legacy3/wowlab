# WoW Lab Sentinel

Distributed task scheduler and monitoring service. Coordinates simulation workload across compute nodes, provides Discord commands for monitoring, and exposes health/metrics endpoints.

## Running

Requires `DISCORD_TOKEN` and `SUPABASE_DB_URL` in `.env`.

```bash
cargo build --release
./target/release/sentinel
```

Starts four concurrent services:

- **Discord Bot** — per-guild Bloom filters for membership-based access control, slash commands for monitoring
- **Scheduler** — PG LISTEN/NOTIFY chunk assignment + stale reclamation
- **Cron** — periodic jobs (node maintenance, telemetry gauge recording)
- **HTTP** — port 8080 (`/status`, `/metrics`, `/nodes/*`, `/chunks/*`)

## How Scheduling Works

1. Listens for `pending_chunk` notifications from Postgres
2. Matches chunks to eligible nodes by capacity and access permissions
3. Uses Bloom filters for Discord guild membership checks
4. Reclaims chunks from nodes offline >60s
5. Marks nodes offline if no heartbeat within 30s

## HTTP API

Public routes:

- `GET /status` — health check (bot + scheduler + uptime)
- `GET /metrics` — Prometheus metrics

Node API (Ed25519 authenticated):

- `POST /nodes/register` — node registration
- `POST /nodes/heartbeat` — node heartbeat
- `POST /chunks/complete` — chunk completion
