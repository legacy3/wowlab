# Phase 2: Move Node Operations to Sentinel HTTP API

## Problem

Node-facing edge functions (`node-register`, `node-heartbeat`, `chunk-complete`) are unnecessary indirection. Both sentinel and nodes connect to the same database. Having nodes talk directly to sentinel's HTTP API removes Supabase function invocation cost and latency, and centralizes all node logic.

## Current Node → Supabase Flow

```
Node                          Supabase Edge Functions         Database
────                          ──────────────────────         ────────
POST /node-register ─────────→ Verify Ed25519, upsert ─────→ nodes
POST /node-heartbeat ────────→ Verify Ed25519, update ─────→ nodes.last_seen_at
POST /chunk-complete ────────→ Verify Ed25519, update ─────→ jobs_chunks, jobs
```

## New Node → Sentinel Flow

```
Node                          Sentinel HTTP (port 8080)       Database
────                          ───────────────────────         ────────
POST /nodes/register ────────→ Verify Ed25519, upsert ─────→ nodes
POST /nodes/heartbeat ───────→ Verify Ed25519, update ─────→ nodes.last_seen_at
POST /chunks/complete ───────→ Verify Ed25519, update ─────→ jobs_chunks, jobs
```

## New Sentinel Routes

### `POST /nodes/register`

**Auth:** Ed25519 signature (same scheme as current edge function)

**Request:**
```json
{
  "hostname": "string",
  "totalCores": 8,
  "enabledCores": 6,
  "platform": "linux",
  "version": "0.5.4"
}
```

**Response:**
```json
{
  "id": "uuid",
  "claimCode": "ABC123",
  "claimed": false
}
```

**Logic:**
1. Verify Ed25519 signature (port `_shared/ed25519.ts` logic to Rust)
2. Check if node exists by `public_key`
3. If exists: return existing id + claim status
4. If new: derive claim code from SHA-256(public_key), insert node row
5. Return id and claim code

### `POST /nodes/heartbeat`

**Auth:** Ed25519 signature

**Request:**
```json
{
  "status": "online"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Node",
  "maxParallel": 4,
  "status": "online"
}
```

**Logic:**
1. Verify Ed25519 signature
2. Update node: `status = payload.status`, `last_seen_at = now()`
3. Only for claimed nodes (`user_id IS NOT NULL`)
4. Return node metadata

**Bonus:** Since sentinel already tracks online nodes for assignment, the heartbeat handler can directly update the in-memory node list without waiting for the next DB poll cycle.

### `POST /chunks/complete`

**Auth:** Ed25519 signature

**Request:**
```json
{
  "chunkId": "uuid",
  "result": {
    "meanDps": 12345.6,
    "stdDps": 234.5,
    "minDps": 11000.0,
    "maxDps": 14000.0,
    "iterations": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobComplete": false
}
```

**Logic:**
1. Verify Ed25519 signature
2. Look up node by public_key
3. Update chunk: `status='completed'`, `result=payload.result`, `completed_at=now()`
4. Increment `jobs.completed_iterations += chunk.iterations`
5. Check remaining chunks for job
6. If all done: aggregate results, write to `jobs.result`, set `status='completed'`
7. If first completion: set `jobs.status='running'`
8. Emit metrics: `CHUNKS_COMPLETED`

## Ed25519 Verification in Rust

Port the verification from `_shared/ed25519.ts`:

```rust
// Message format: "{timestamp}\0{method}\0{pathname}\0{body_sha256}"
// Headers: X-Node-Key, X-Node-Sig, X-Node-Ts (all Base64)
// Timestamp must be within 300 seconds
// Use ed25519-dalek crate
```

**Crate:** `ed25519-dalek` + `sha2` (already in sentinel's dependency tree via other uses)

## Changes to Node Crate

### `crates/node/src/supabase/client.rs`

Replace Supabase function URLs with sentinel URL:

```rust
// Before:
let url = format!("{}/functions/v1/node-register", self.supabase_url);

// After:
let url = format!("{}/nodes/register", self.sentinel_url);
```

Same request format, same auth headers. Only the base URL changes.

### Config: Add `SENTINEL_URL` env var

Nodes need to know sentinel's address. Add to node config:
```
SENTINEL_URL=https://sentinel.fly.dev
```

### Keep Supabase Realtime subscription

Nodes still subscribe to `jobs_chunks` table changes via Supabase Realtime. This is the push mechanism for receiving chunk assignments. This stays as-is since it's database-level, not edge-function-level.

## Migration Steps

1. Add Ed25519 verification to sentinel (`src/http/auth.rs`)
2. Add three new routes to sentinel's Axum router
3. Add `SENTINEL_URL` config to node crate
4. Update node client to use sentinel URL for register/heartbeat/complete
5. Test end-to-end
6. Delete edge functions (Phase 5)
