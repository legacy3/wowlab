# Realtime Architecture

This document describes the realtime infrastructure for wowlab, including Centrifugo (beacon), Sentinel, and their integration with Supabase and the Node binary.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USER                                          │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────────┐
│         apps/portal               │   │         crates/node                    │
│     (portal.wowlab.gg)            │   │      (Node Binary)                     │
│                                   │   │                                        │
│  • Supabase Auth (OAuth)          │   │  • Ed25519 keypair generation          │
│  • Centrifugo token generation    │   │  • Signed HTTP requests                │
│  • Job creation via RPC           │   │  • Simulation execution                │
│  • Node claiming via RPC          │   │                                        │
└───────────┬───────────────────────┘   └─────────────┬──────────────────────────┘
            │                                         │
            │ ┌───────────────────────────────────────┤
            │ │                                       │
            ▼ ▼                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────────┐
│     beacon.wowlab.gg              │   │     sentinel.wowlab.gg                 │
│       (Centrifugo)                │   │       (Rust Scheduler)                 │
│                                   │   │                                        │
│  • WebSocket: /connection/ws      │   │  • HTTP: /nodes/register               │
│  • HTTP API: /api/*               │   │  • HTTP: /chunks/complete              │
│  • Channels:                      │   │  • Discord bot                         │
│    - nodes:online (presence)      │   │  • PG LISTEN scheduler                 │
│    - nodes:{id} (config)          │   │  • Presence poller (5s)                │
│    - chunks:{id} (assignments)    │   │                                        │
│  • Redis backend (Upstash)        │   │                                        │
└───────────┬───────────────────────┘   └─────────────┬──────────────────────────┘
            │                                         │
            │                                         │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           api.wowlab.gg (Supabase)                              │
│                                                                                  │
│  • PostgreSQL: nodes, jobs, jobs_chunks, nodes_permissions                      │
│  • Auth: Discord/GitHub OAuth, JWT sessions                                     │
│  • RPC: verify_claim_code(), claim_node(), create_job()                         │
│  • PG NOTIFY: pending_chunk channel                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. beacon.wowlab.gg (Centrifugo)

**Purpose**: Realtime WebSocket server for pub/sub messaging and presence tracking.

**Deployment**: Fly.io with Upstash Redis backend
- App name: `wowlab-beacon`
- Primary region: `lhr` (London)
- Base image: `centrifugo/centrifugo:v6`
- Internal port: 8000
- Resources: shared-cpu-1x, 512MB RAM

**Configuration**: `deploy/beacon/config.json`

**Endpoints**:
| Endpoint | Purpose |
|----------|---------|
| `/connection/websocket` | WebSocket connections (Protobuf format) |
| `/api/publish` | Publish message to channel |
| `/api/broadcast` | Broadcast to multiple channels |
| `/api/presence` | Get presence info for channel |
| `/api/presence_stats` | Get presence statistics |
| `/health` | Health check |
| `/metrics` | Prometheus metrics |

**Channel Namespaces**:

| Namespace | Pattern | Features | History |
|-----------|---------|----------|---------|
| `nodes` | `nodes:{uuid}` | presence, join_leave, force_push | 10 msgs, 60s TTL |
| `jobs` | `jobs:{uuid}` | - | 100 msgs, 300s TTL |
| `chunks` | `chunks:{uuid}` | - | 10 msgs, 60s TTL |

**Special Channels**:
- `nodes:online` - Global presence channel for tracking online nodes

**Authentication**:

| Type | Mechanism | Secret |
|------|-----------|--------|
| Client (WebSocket) | JWT with HMAC-SHA256 | `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY` |
| Server (HTTP API) | `X-API-Key` header | `CENTRIFUGO_HTTP_API_KEY` |

**Environment Variables** (Fly.io secrets):
- `CENTRIFUGO_TOKEN_SECRET` - HMAC secret for JWT tokens
- `CENTRIFUGO_API_KEY` - Server-side API key
- `CENTRIFUGO_ADMIN_PASSWORD` - Admin UI password
- `CENTRIFUGO_ADMIN_SECRET` - Admin secret
- `CENTRIFUGO_ENGINE__REDIS__ADDRESS` - Redis connection string

---

### 2. sentinel.wowlab.gg (Rust Scheduler)

**Purpose**: Task scheduler, Discord bot, and node coordinator.

**Crate**: `crates/sentinel`

**Port**: 8080 (HTTP)

**Concurrent Services** (via `tokio::select!`):
1. **Bot** - Discord bot with slash commands
2. **Scheduler** - PG LISTEN for pending chunks + assignment logic
3. **Cron** - Periodic jobs (reclaim stale chunks, cleanup, metrics)
4. **HTTP** - REST API for node operations
5. **Presence** - Centrifugo presence polling (every 5s)

**HTTP Endpoints**:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/nodes/register` | POST | Ed25519 | Register new node |
| `/nodes/heartbeat` | POST | Ed25519 | Node heartbeat |
| `/chunks/complete` | POST | Ed25519 | Report chunk completion |
| `/status` | GET | None | Health check |
| `/metrics` | GET | None | Prometheus metrics |

**Ed25519 Authentication**:

Headers required:
- `X-Node-Key`: Base64-encoded public key
- `X-Node-Sig`: Base64-encoded signature
- `X-Node-Ts`: Unix timestamp

Message format: `{timestamp}\0{method}\0{pathname}\0{body_sha256_hex}`

Clock skew tolerance: 5 minutes

**Database Connection**:
- Direct PostgreSQL via `sqlx`
- Connection pool: 5 connections
- Acquire timeout: 5 seconds
- Uses PG LISTEN/NOTIFY for chunk notifications

**Centrifugo Integration**:
- Uses HTTP API only (not WebSocket)
- Polls `nodes:online` presence every 5 seconds
- Updates node status in database based on presence changes

**Environment Variables**:
- `SUPABASE_DB_URL` - PostgreSQL connection string
- `CENTRIFUGO_API_URL` - Beacon HTTP API URL (https://beacon.wowlab.gg)
- `CENTRIFUGO_HTTP_API_KEY` - API key for Centrifugo

---

### 3. apps/portal (Next.js)

**Purpose**: Web UI for users to manage nodes, create jobs, and monitor simulations.

**Centrifugo Integration**:

**Token Generation**: `apps/portal/src/app/api/centrifugo/token/route.ts`
```typescript
const token = await new SignJWT({ sub: user.id })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY));
```

**Client Connection**: `apps/portal/src/lib/refine/live-provider.ts`
- Uses `centrifuge` npm package (v5.5.3)
- Singleton client instance
- WebSocket with Protobuf format
- Auto-reconnection handled by library

**Live Provider Integration**:
- Integrated with Refine framework
- `liveMode: "auto"` for automatic subscriptions
- Resources: `rotations`, `user_profiles`, `jobs`, `nodes`, `nodes_permissions`

**Supabase Integration**:
- `@supabase/ssr` with cookie-based sessions
- OAuth providers: Discord, GitHub
- RPC calls for node claiming and job creation

---

### 4. crates/node (Rust Binary)

**Purpose**: Distributed simulation worker that executes jobs.

**Authentication**:

| Target | Mechanism |
|--------|-----------|
| sentinel.wowlab.gg | Ed25519 signatures |
| beacon.wowlab.gg | JWT token (HMAC) |
| api.wowlab.gg | Supabase anon key |

**Keypair Storage**: `~/.config/wowlab-node/keypair`

**Centrifugo Subscriptions** (from `crates/node/src/realtime.rs`):
1. `nodes:{node_id}` - Node configuration updates
2. `chunks:{node_id}` - Chunk assignments (join_leave: false)
3. `nodes:online` - Presence channel (join_leave: true)

**Protocol**: Protobuf (`crates/centrifugo/src/proto/centrifugo.proto`)

---

### 5. api.wowlab.gg (Supabase)

**Purpose**: PostgreSQL database, authentication, and REST API.

**Database Tables**:

#### `nodes`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (NULL until claimed) |
| `public_key` | text | Ed25519 public key (base64) |
| `claim_code` | text | 6-char base32 code (NULL after claimed) |
| `name` | text | Display name |
| `total_cores` | int | Hardware CPU cores |
| `max_parallel` | int | Configured parallelism |
| `status` | text | 'pending' \| 'online' \| 'offline' |
| `platform` | text | OS-arch identifier |
| `version` | text | Node software version |
| `last_seen_at` | timestamptz | Updated by presence system |
| `created_at` | timestamptz | Registration time |

#### `jobs`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Job owner |
| `config_hash` | text | FK to jobs_configs |
| `total_iterations` | int | Total simulation iterations |
| `completed_iterations` | int | Completed count |
| `status` | text | 'pending' \| 'running' \| 'completed' \| 'failed' |
| `result` | jsonb | Aggregated simulation results |
| `access_type` | text | 'private' \| 'public' \| 'user' \| 'discord' |
| `discord_server_id` | text | For Discord guild access |

#### `jobs_chunks`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `job_id` | uuid | Parent job |
| `node_id` | uuid | Assigned node (nullable) |
| `config_hash` | text | Configuration reference |
| `iterations` | int | Chunk size |
| `seed_offset` | int | RNG seed offset |
| `status` | text | 'pending' \| 'running' \| 'completed' |
| `result` | jsonb | Chunk results |

#### `nodes_permissions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `node_id` | uuid | Node reference |
| `access_type` | text | Permission type |
| `target_id` | text | User/guild ID |

**RPC Functions**:

| Function | Purpose |
|----------|---------|
| `verify_claim_code(code)` | Verify claim code exists and node is unclaimed |
| `claim_node(node_id, name, max_parallel)` | Assign node to current user |
| `create_job(config, iterations, access_type, discord_server_id)` | Create job with chunks |

**Triggers**:
- `notify_pending_chunk` - Sends `pg_notify('pending_chunk', chunk_id)` on chunk creation

---

## Data Flows

### Flow 1: Node Registration

```
Node                    sentinel.wowlab.gg              Supabase
  │                            │                            │
  │──POST /nodes/register──────▶│                            │
  │   Headers:                 │                            │
  │   X-Node-Key: <pubkey>     │                            │
  │   X-Node-Sig: <signature>  │                            │
  │   X-Node-Ts: <timestamp>   │                            │
  │                            │                            │
  │                            │──INSERT INTO nodes─────────▶│
  │                            │   (status='pending',        │
  │                            │    claim_code=<6-char>)     │
  │                            │                            │
  │◀──{id, claimCode}──────────│                            │
```

**Claim code generation**: `SHA-256(pubkey) → first 4 bytes → base32 → first 6 chars`

### Flow 2: Node Claiming

```
Portal                         Supabase
  │                               │
  │──RPC verify_claim_code(code)──▶│
  │                               │──SELECT FROM nodes WHERE claim_code = code
  │◀──{id, name, platform, cores}─│
  │                               │
  │──RPC claim_node(id, name, n)──▶│
  │                               │──UPDATE nodes SET user_id=auth.uid(),
  │                               │                   claim_code=NULL
  │◀──{success: true}─────────────│
```

### Flow 3: Portal Centrifugo Connection

```
Portal                    Portal API              beacon.wowlab.gg
  │                          │                          │
  │──fetch /api/centrifugo/token──▶│                          │
  │                          │──validate Supabase session
  │                          │──sign JWT {sub: user.id}
  │◀──{token: <jwt>}─────────│                          │
  │                          │                          │
  │══════════WebSocket═══════════════════════════════════▶│
  │   (Authorization: Bearer <jwt>)                     │
  │                          │                          │
  │──subscribe nodes:online──────────────────────────────▶│
  │◀──presence updates───────────────────────────────────│
```

### Flow 4: Node Presence Detection

```
Node                beacon.wowlab.gg       sentinel.wowlab.gg      Supabase
  │                       │                       │                   │
  │═══WebSocket══════════▶│                       │                   │
  │──subscribe nodes:online──▶│                       │                   │
  │   (join_leave: true)  │                       │                   │
  │                       │                       │                   │
  │                       │◀──GET /api/presence───│ (every 5s)        │
  │                       │   channel=nodes:online│                   │
  │                       │                       │                   │
  │                       │──{clients: [{user: uuid}...]}──▶│                   │
  │                       │                       │                   │
  │                       │                       │──compare with prev│
  │                       │                       │                   │
  │                       │                       │──UPDATE nodes─────▶│
  │                       │                       │   SET status=     │
  │                       │                       │   'online'/'offline'
```

### Flow 5: Job Submission & Chunk Assignment

```
Portal           Supabase              sentinel.wowlab.gg     beacon.wowlab.gg   Node
  │                 │                        │                      │              │
  │──RPC create_job──▶│                        │                      │              │
  │                 │──INSERT jobs            │                      │              │
  │                 │──INSERT jobs_chunks     │                      │              │
  │                 │──TRIGGER notify_pending_chunk                  │              │
  │                 │                        │                      │              │
  │                 │──pg_notify('pending_chunk', id)──▶│                      │              │
  │                 │                        │                      │              │
  │                 │◀──SELECT pending chunks─│                      │              │
  │                 │──{chunks...}────────────▶│                      │              │
  │                 │                        │                      │              │
  │                 │◀──SELECT online nodes───│                      │              │
  │                 │──{nodes...}─────────────▶│                      │              │
  │                 │                        │                      │              │
  │                 │                        │──match chunks to nodes│              │
  │                 │                        │  (capacity, permissions)             │
  │                 │                        │                      │              │
  │                 │◀──UPDATE chunks SET─────│                      │              │
  │                 │   node_id, status      │                      │              │
  │                 │                        │                      │              │
  │                 │                        │──POST /api/publish───▶│              │
  │                 │                        │   channel=chunks:{id} │              │
  │                 │                        │   data={chunk...}    │              │
  │                 │                        │                      │──push────────▶│
  │                 │                        │                      │              │
```

### Flow 6: Chunk Completion

```
Node                sentinel.wowlab.gg              Supabase
  │                        │                            │
  │──POST /chunks/complete─▶│                            │
  │   {chunk_id, result}   │                            │
  │   (Ed25519 signed)     │                            │
  │                        │                            │
  │                        │──UPDATE jobs_chunks────────▶│
  │                        │   SET result, status       │
  │                        │                            │
  │                        │──UPDATE jobs───────────────▶│
  │                        │   SET completed_iterations  │
  │                        │   aggregate results        │
  │                        │                            │
  │◀──{success: true}──────│                            │
```

### Flow 7: Discord Access Control

```
Sentinel                              Supabase
   │                                     │
   │──SELECT nodes.*, identities.provider_id──▶│
   │   FROM nodes                        │
   │   JOIN auth.identities ON discord   │
   │                                     │
   │◀──{node_id, discord_id...}──────────│
   │                                     │
   │──Build Bloom filter from guild members
   │                                     │
   │──For each job with access_type='discord':
   │   Check if node owner's discord_id
   │   is in job's guild Bloom filter
```

---

## Crate Structure

### crates/centrifugo

Shared Centrifugo client library.

**Files**:
- `src/api.rs` - HTTP API client (`CentrifugoApi`)
- `src/client.rs` - WebSocket client with Protobuf
- `src/proto/centrifugo.proto` - Protocol buffer definitions

**API Client Usage**:
```rust
let api = CentrifugoApi::from_env()?;  // CENTRIFUGO_API_URL, CENTRIFUGO_HTTP_API_KEY

// Get presence
let clients = api.presence("nodes:online").await?;

// Publish message
api.publish("chunks:uuid", &payload).await?;
```

### crates/sentinel

Task scheduler and coordinator.

**Key Files**:
- `src/main.rs` - Entry point, spawns 5 concurrent services
- `src/http/routes/nodes.rs` - Node registration endpoints
- `src/http/auth.rs` - Ed25519 verification middleware
- `src/scheduler/mod.rs` - PG LISTEN and chunk assignment
- `src/scheduler/assign.rs` - Assignment algorithm with access control
- `src/presence.rs` - Centrifugo presence polling

### crates/node

Distributed worker binary.

**Key Files**:
- `src/main.rs` - Entry point
- `src/core.rs` - Main node logic
- `src/auth.rs` - Ed25519 keypair management
- `src/realtime.rs` - Centrifugo WebSocket client
- `src/config.rs` - Configuration

---

## Environment Variables

### Portal (apps/portal)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_CENTRIFUGO_URL` | Centrifugo WebSocket URL |
| `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY` | JWT signing secret |

### Sentinel (crates/sentinel)

| Variable | Description |
|----------|-------------|
| `SUPABASE_DB_URL` | PostgreSQL connection string |
| `CENTRIFUGO_API_URL` | Beacon HTTP API URL |
| `CENTRIFUGO_HTTP_API_KEY` | API key for Centrifugo |
| `DISCORD_TOKEN` | Discord bot token |

### Node (crates/node)

| Variable | Description |
|----------|-------------|
| `WOWLAB_API_URL` | Supabase API URL |
| `WOWLAB_ANON_KEY` | Supabase anonymous key |
| `WOWLAB_SENTINEL_URL` | Sentinel HTTP URL |
| `WOWLAB_BEACON_URL` | Centrifugo WebSocket URL |

### Beacon (deploy/beacon)

| Variable | Description |
|----------|-------------|
| `CENTRIFUGO_TOKEN_SECRET` | HMAC secret for client JWTs |
| `CENTRIFUGO_API_KEY` | Server-side API key |
| `CENTRIFUGO_ADMIN_PASSWORD` | Admin UI password |
| `CENTRIFUGO_ADMIN_SECRET` | Admin secret |
| `CENTRIFUGO_ENGINE__REDIS__ADDRESS` | Redis connection |

---

## Known Issues (as of 2026-01-25)

### Issue 1: Missing Centrifugo Publishing

**Severity**: Critical

**Location**: `crates/sentinel/src/scheduler/assign.rs`

**Problem**: After `batch_assign()` updates chunks in the database, nothing publishes to Centrifugo to notify nodes. Nodes subscribe to `chunks:{node_id}` but never receive messages.

**Expected Implementation**:
```rust
// After batch_assign() completes
for assignment in &assignments {
    let payload = json!({
        "id": assignment.chunk_id,
        "iterations": chunk.iterations,
        "configHash": chunk.config_hash,
        "seedOffset": chunk.seed_offset,
    });
    api.publish(&format!("chunks:{}", assignment.node_id), &payload).await?;
}
```

### Issue 2: Node Centrifugo URL Misconfiguration

**Severity**: Critical

**Location**: `crates/node/src/core.rs:358`

**Problem**: Nodes use `api_url` (api.wowlab.gg) for Centrifugo connections instead of beacon.wowlab.gg.

**Current Code**:
```rust
NodeRealtime::new(&self.config.api_url, &self.config.anon_key)
```

**Fix**: Add `beacon_url` to node config and use it:
```rust
NodeRealtime::new(&self.config.beacon_url, &token)
```

### Issue 3: Node Centrifugo Token Authentication

**Severity**: Critical

**Location**: `crates/node/src/realtime.rs`

**Problem**: Nodes use Supabase `anon_key` as Centrifugo token. Centrifugo expects HMAC-signed JWTs.

**Current**: Uses `anon_key` (Supabase JWT with role=anon)

**Required**: Either:
1. Generate node-specific Centrifugo tokens on the server
2. Add a token endpoint to sentinel that nodes can call after registration

---

## Component Status Matrix

| Component | Connection | Status |
|-----------|------------|--------|
| Portal → beacon.wowlab.gg | WebSocket + JWT | ✅ Working |
| Portal → api.wowlab.gg | Supabase client | ✅ Working |
| Sentinel → beacon.wowlab.gg | HTTP API (presence) | ✅ Working |
| Sentinel → Supabase | PostgreSQL | ✅ Working |
| Node → sentinel.wowlab.gg | HTTP + Ed25519 | ✅ Working |
| Node → beacon.wowlab.gg | WebSocket | ❌ Wrong URL & token |
| Sentinel → Centrifugo publish | HTTP API | ❌ Not implemented |

---

## Migration History

### Supabase Realtime → Centrifugo (commit ec070804)

**Removed**:
- `crates/supabase/src/realtime.rs` - Supabase Realtime client
- `supabase-realtime-rs` dependency
- Edge functions for node operations (moved to sentinel)

**Added**:
- `crates/centrifugo/` - New Centrifugo client crate
- `deploy/beacon/` - Centrifugo deployment config
- Sentinel presence polling via HTTP API

**Incomplete**:
- Chunk assignment publishing to Centrifugo
- Node configuration for beacon URL
- Node token authentication for Centrifugo
