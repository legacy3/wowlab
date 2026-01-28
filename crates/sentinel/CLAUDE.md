# sentinel

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

Distributed task scheduler and monitoring service. Runs a Discord bot, chunk scheduler, cron jobs, and HTTP server concurrently.

## Commands

```bash
cargo build --release
cargo test                # Bloom filter tests
RUST_LOG=sentinel=debug ./target/release/sentinel
```

Requires `DISCORD_TOKEN` and `SUPABASE_DB_URL` environment variables.

## Architecture

```
src/
  bot/
    commands/wlab/  - Slash commands (ping, about, nodes, jobs, stats, etc.)
    events.rs       - Discord gateway event handlers
    mod.rs          - Bot setup and error handling (Poise framework)
  http/
    auth.rs         - Ed25519 signature verification for node API
    routes/         - index, status, metrics, favicon, nodes, chunks
    mod.rs          - Axum router on port 8080
  scheduler/
    assign.rs       - Chunk-to-node matching with capacity and permissions
    reclaim.rs      - Stale chunk recovery (nodes offline >60s)
    maintenance.rs  - Mark nodes offline, stale data cleanup
    mod.rs          - PG LISTEN loop with 30s timeout
  cron/
    mod.rs          - Job scheduler with CronJob trait
  utils/
    bloom.rs        - SHA-256 Bloom filter (Kirsch-Mitzenmack, 0.1% FP rate)
    filter_refresh.rs - Per-guild filter lifecycle (build, insert, rebuild)
    discord.rs      - Paginated member fetching
    embed.rs        - EmbedContent builder for Discord embeds
    sys.rs          - Linux /proc system metrics
    colors.rs       - Discord embed color constants
    meta.rs         - App metadata constants
  state.rs          - Shared ServerState (db, filters, metrics, shard manager)
  telemetry.rs      - Prometheus metrics + RecordGaugesJob cron
  main.rs           - Entry point, runs bot + scheduler + cron + http via tokio::select!
```

## Key Types

- `ServerState` - Shared across all services (PgPool, FilterMap, PrometheusHandle, ShardManager)
- `BloomFilter` - SHA-256 based, interoperable with TypeScript implementation
- `FilterMap` - `Arc<RwLock<HashMap<GuildId, GuildFilter>>>`
- `CancellationToken` - Graceful shutdown signal across services
- `Context<'a>` - Poise command context alias

## Scheduler Flow

1. PG LISTEN on `pending_chunk`
2. Fetch pending chunks (limit 100)
3. Match to eligible nodes (capacity + access permissions + Bloom filter)
4. Batch assign via unnest arrays
5. Every 30s: reclaim stale chunks, update Prometheus gauges

## Access Control

- **public**: any node
- **user**: explicit `nodes_permissions` entry
- **discord**: node owner's Discord ID in guild's Bloom filter
- **owner**: always eligible for own jobs

## Dependencies

- `poise` - Discord bot framework
- `axum` - HTTP server
- `sqlx` - PostgreSQL (async, compile-time checked queries)
- `tokio` - Async runtime
- `tokio-cron-scheduler` - Cron job scheduling
- `ed25519-dalek` - Ed25519 signatures for node auth
- `metrics` + `metrics-exporter-prometheus` - Prometheus metrics
- `sha2` - Bloom filter hashing
- `tracing` - Structured logging
