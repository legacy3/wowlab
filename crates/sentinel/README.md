# WoW Lab Sentinel

Distributed task scheduler and monitoring service. Coordinates simulation workload across compute nodes, provides Discord commands for monitoring, and exposes health/metrics endpoints.

## Running

Requires environment variables — see `.env.example`.

```bash
cargo build --release
./target/release/sentinel
```

Starts five concurrent services:

- **Discord Bot** — per-guild Bloom filters for membership-based access control, slash commands for monitoring
- **Scheduler** — PG LISTEN/NOTIFY chunk assignment + stale reclamation
- **Cron** — periodic jobs (node maintenance, telemetry gauge recording)
- **Presence** — Centrifugo presence polling for node online/offline tracking
- **HTTP** — port 8080 (`/status`, `/metrics`, `/nodes/*`, `/chunks/*`)

## How Scheduling Works

1. Listens for `pending_chunk` notifications from Postgres
2. Matches chunks to eligible nodes by capacity and access permissions
3. Uses Bloom filters for Discord guild membership checks
4. Reclaims chunks from nodes offline >60s

## Presence Monitoring

Polls Centrifugo every 5 seconds to track node connectivity:

1. Queries `nodes:online` channel presence via Centrifugo HTTP API
2. Compares current presence with previous state to detect joins/leaves
3. Updates node `status` and `last_seen_at` in database
4. Updates `nodes_online` Prometheus gauge

## HTTP API

Public routes:

- `GET /status` — health check (bot + scheduler + uptime)
- `GET /metrics` — Prometheus metrics

Node API (Ed25519 authenticated):

- `POST /nodes/register` — node registration, returns beacon token
- `POST /nodes/heartbeat` — node heartbeat (verifies claimed status)
- `POST /nodes/token` — refresh beacon token for Centrifugo
- `POST /chunks/complete` — chunk completion
