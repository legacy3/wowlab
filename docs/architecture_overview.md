# Realtime Architecture v2

Horizontally scalable, realtime-first architecture. Stateless sentinels, Redis for coordination, Centrifugo for auth + push.

## Domains

| Domain               | Service    | Purpose                                   |
| -------------------- | ---------- | ----------------------------------------- |
| `api.wowlab.gg`      | Supabase   | Portal database, auth, user data          |
| `sentinel.wowlab.gg` | Sentinel   | Node HTTP API (register, token)           |
| `beacon.wowlab.gg`   | Centrifugo | WebSocket connections, realtime messaging |

**Nodes connect to:** `sentinel.wowlab.gg` (HTTP) and `beacon.wowlab.gg` (WebSocket)
**Nodes NEVER connect to:** `api.wowlab.gg`, Redis, or Supabase directly

## Network Topology

```
                    INTERNET
    ─────────────────────────────────────────────────────
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │  Portal │    │  Node 1  │    │  Node N  │
    └────┬────┘    └────┬─────┘    └────┬─────┘
         │              │               │
         │              │               │
    ─────┼──────────────┼───────────────┼─────────────────
         │              │               │
         │         ┌────┴───────────────┴────┐
         │         │                         │
         │         ▼                         ▼
         │    sentinel.wowlab.gg       beacon.wowlab.gg
         │    (HTTP: register,         (WSS: subscribe,
         │     token)                   publish, RPC)
         │         │                         │
         │         └────────────┬────────────┘
         │                      │
         │                      ▼
         │               ┌────────────┐
         │               │  Sentinel  │◄──── proxy callbacks
         │               └─────┬──────┘
         │                     │
         │         ┌───────────┼───────────┐
         │         │           │           │
         │         ▼           ▼           ▼
         │    ┌─────────┐ ┌─────────┐ ┌─────────┐
         │    │  Redis  │ │Centrifugo│ │Supabase │
         │    └─────────┘ └─────────┘ └────┬────┘
         │                                 │
         └─────────────────────────────────┘
                   (Portal only)

    ═══════════════════════════════════════════════════════
    WHO CONNECTS TO WHAT:
    ═══════════════════════════════════════════════════════
    Portal  → api.wowlab.gg (Supabase)     ✓
    Portal  → beacon.wowlab.gg (Centrifugo) ✓
    Node    → sentinel.wowlab.gg (HTTP)     ✓
    Node    → beacon.wowlab.gg (WSS)        ✓
    Node    → api.wowlab.gg (Supabase)      ✗ NEVER
    Node    → Redis                         ✗ NEVER
```

## Design Principles

1. **Sentinels are stateless** - Any instance can handle any request

**Restart Safety:** Any sentinel can crash at any point and another instance (or the same after restart) can continue. All in-flight operations are either:

- Completed atomically (Lua scripts)
- Idempotent and safe to retry
- Recoverable from Redis state

Specifically:

- Chunk assignments: Written to Redis before WS push. If push fails, resync recovers.
- Chunk completions: Idempotency key prevents double-counting.
- Job aggregation: Lock with timestamp allows stuck lock recovery.
- Background tasks: Leader election prevents duplicate work, but tasks are idempotent if it fails.

2. **Redis is the brain** - All coordination state lives in Redis
3. **Centrifugo owns connections** - WebSocket management, presence, message routing
4. **Ed25519 for node auth** - Nodes authenticate via signed requests (not just JWT trust). Signatures include timestamp + nonce to prevent replay attacks. For state-modifying requests, include SHA-256 content digest of request body
5. **Supabase for durability** - Final results and user data only
6. **Idempotency everywhere** - Every operation must be safe to retry
7. **Heartbeats over presence** - Active health checks, presence as optimization only
8. **Nodes connect to sentinel + beacon only** - HTTP to `sentinel.wowlab.gg`, WebSocket to `beacon.wowlab.gg`. Never to `api.wowlab.gg` (Supabase) or Redis

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    ┌──────────┐              ┌──────────┐              ┌──────────┐                      │
│    │  Portal  │              │  Node 1  │              │  Node N  │                      │
│    └────┬─────┘              └────┬─────┘              └────┬─────┘                      │
│         │                         │                         │                            │
└─────────┼─────────────────────────┼─────────────────────────┼────────────────────────────┘
          │                         │                         │
          │ WSS                     │ WSS                     │ WSS
          │ subscribe               │ subscribe               │ subscribe
          │ jobs:{id}               │ nodes:{id}              │ nodes:{id}
          │                         │ publish                 │ publish
          │                         │ chunks:complete         │ chunks:complete
          │                         │                         │
┌─────────┼─────────────────────────┼─────────────────────────┼────────────────────────────┐
│         ▼                         ▼                         ▼                            │
│    ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│    │                           beacon.wowlab.gg                                       │   │
│    │                             (Centrifugo)                                         │   │
│    │                                                                                  │   │
│    │   Auth: JWT verification for all connections                                     │   │
│    │   Refresh: Token refresh callback to sentinel                                    │   │
│    │                                                                                  │   │
│    │   Channels:                              Proxy:                                  │   │
│    │   • nodes:online (presence, hint only)   • connect → POST /proxy/connect         │   │
│    │   • nodes:{id} (→ node)                  • subscribe → POST /proxy/subscribe     │   │
│    │   • jobs:{id} (→ portal)                 • publish → POST /proxy/publish         │   │
│    │                                          • refresh → POST /proxy/refresh         │   │
│    │                                                                                  │   │
│    └──────────────────────────────┬───────────────────────────────────────────────────┘   │
│                                   │                                                       │
│                                   │ proxy callbacks                                       │
│                                   │ (authenticated via shared secret)                     │
│                                   ▼                                                       │
│    ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│    │                    Load Balancer (sentinel.wowlab.gg)                            │   │
│    └───────┬─────────────────────┬─────────────────────────┬─────────────────────────┘   │
│            │                     │                         │                              │
│            ▼                     ▼                         ▼                              │
│    ┌─────────────┐       ┌─────────────┐           ┌─────────────┐                       │
│    │ Sentinel 1  │       │ Sentinel 2  │           │ Sentinel N  │    (stateless)        │
│    └──────┬──────┘       └──────┬──────┘           └──────┬──────┘                       │
│           │                     │                         │                              │
│           └─────────────────────┼─────────────────────────┘                              │
│                                 │                                                        │
│                                 ▼                                                        │
│    ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│    │                              Redis (Single Instance or Sentinel)                 │   │
│    │                          (shared with Centrifugo, NOT Cluster)                   │   │
│    │                                                                                  │   │
│    │   {node}:{id}:state     = Hash { backlog, last_heartbeat }                       │   │
│    │   {node}:{id}:chunks    = Set { chunk_ids }                                      │   │
│    │   {job}:{id}            = Hash { total, completed, config_hash, lock, lock_at }  │   │
│    │   {job}:{id}:results    = List [ results... ]                                    │   │
│    │   {chunk}:{id}          = Hash { job_id, node_id, iterations, seed_offset }      │   │
│    │   {node}:backlog:sorted = ZSet { node_id: backlog_count }                        │   │
│    │   config:{hash}         = String (serialized config, 7d TTL)                     │   │
│    │   ratelimit:{node}:{window} = Integer (rate limit counter)                       │   │
│    │                                                                                  │   │
│    └──────────────────────────────┬───────────────────────────────────────────────────┘   │
│                                   │                                                       │
│                    INFRASTRUCTURE │                                                       │
└───────────────────────────────────┼───────────────────────────────────────────────────────┘
                                    │
                                    │ final results only
                                    ▼
                         ┌─────────────────────┐
                         │      Supabase       │
                         │                     │
                         │  jobs (results)     │
                         │  nodes (config)     │
                         └─────────────────────┘
```

**Important:** We use Redis single instance or Redis Sentinel (for HA), NOT Redis Cluster. Lua scripts require multi-key atomicity which Cluster cannot provide without hash tags on ALL keys.

**Redis Sentinel HA Configuration:** For production, deploy 3+ Sentinel nodes with `min-replicas-to-write 1` and `min-replicas-max-lag 10` on the master to prevent data loss during failover. Note that in-flight Lua scripts during failover may be lost - idempotency keys handle this gracefully.

**Design Decision - Dynamic Key Construction:** Some Lua scripts (notably `complete_chunk.lua` and `select_nodes.lua`) construct keys dynamically from data read within the script. This is explicitly discouraged by Redis for Cluster compatibility, but is intentional here because:

1. We are committed to single instance/Sentinel (no Cluster)
2. It simplifies the caller interface (fewer KEYS to pass)
3. All dynamically-accessed keys use consistent hash tags (`{node}:`, `{job}:`) for future reference
4. This decision is documented and understood - do not "fix" it without architectural changes

## Channels

| Channel           | Type            | Direction         | Purpose                                            |
| ----------------- | --------------- | ----------------- | -------------------------------------------------- |
| `nodes:online`    | Presence        | Automatic         | Hint for online nodes (NOT authoritative)          |
| `nodes:{id}`      | Subscribe       | Sentinel → Node   | Chunk assignments, config updates, heartbeat pings |
| `jobs:{id}`       | Subscribe       | Sentinel → Portal | Job progress, completion                           |
| `chunks:complete` | Publish + Proxy | Node → Sentinel   | Chunk results (proxied to HTTP)                    |

## HTTP Endpoints

### External (Node → Sentinel)

| Endpoint               | Auth    | Purpose                          |
| ---------------------- | ------- | -------------------------------- |
| `POST /nodes/register` | Ed25519 | Initial node registration        |
| `POST /nodes/token`    | Ed25519 | Get Centrifugo JWT (short-lived) |
| `GET /config/{hash}`   | Ed25519 | Fetch simulation config          |

**Token Issuance Flow:**

1. Node calls `POST /nodes/token` on `sentinel.wowlab.gg` with Ed25519 signature
2. Sentinel verifies signature and checks node exists (Sentinel queries Supabase, not the node)
3. Sentinel creates JWT signed with `CENTRIFUGO_TOKEN_SECRET` (NOT a Supabase token)
4. JWT includes `sub: node-id`, `channels: ["nodes:{node-id}"]`, 15min expiry
5. Node uses this JWT to connect to Centrifugo at `wss://beacon.wowlab.gg/connection/websocket`

**Important:** Supabase anon tokens are NOT valid for Centrifugo. Nodes MUST obtain tokens from Sentinel.

**Ed25519 signature validation:** Requests include `timestamp` (Unix ms) and `nonce` (UUID). Signature covers `method|path|timestamp|nonce|body_hash`. Server rejects requests where `|now - timestamp| > 60s` and tracks used nonces for 2 minutes to prevent replay attacks.

### Internal (Centrifugo → Sentinel)

| Endpoint                | Auth         | Purpose                                       |
| ----------------------- | ------------ | --------------------------------------------- |
| `POST /proxy/connect`   | Proxy Secret | Validate new connections, set connection meta |
| `POST /proxy/subscribe` | Proxy Secret | Authorize channel subscriptions               |
| `POST /proxy/publish`   | Proxy Secret | Handle chunk completions                      |
| `POST /proxy/refresh`   | Proxy Secret | Issue refreshed JWT, update heartbeat         |
| `POST /proxy/rpc`       | Proxy Secret | Handle RPC requests (config fetch, etc.)      |

**Proxy Secret:** Centrifugo includes `X-Centrifugo-Proxy-Secret` header. Sentinel validates this matches configured secret. This prevents direct HTTP access to proxy endpoints.

### RPC Methods (via Centrifugo)

| Method         | Direction       | Purpose                         |
| -------------- | --------------- | ------------------------------- |
| `getConfig`    | Node → Sentinel | Fetch simulation config by hash |
| `getChunkInfo` | Node → Sentinel | Get chunk assignment details    |

**Why RPC?** Instead of nodes making HTTP calls, they use Centrifugo's RPC feature over the existing WebSocket connection. This reduces connection overhead and keeps all communication through a single channel.

### Health

| Endpoint       | Auth | Purpose            |
| -------------- | ---- | ------------------ |
| `GET /status`  | None | Health check       |
| `GET /metrics` | None | Prometheus metrics |

## Centrifugo Configuration (v5 Format)

```json
{
  "engine": {
    "type": "redis",
    "redis": {
      "address": "redis:6379",
      "prefix": "centrifugo",
      "presence_hash_field_ttl": true
    }
  },

  // For Redis Sentinel HA, replace "address" with:
  // "sentinel_addresses": ["sentinel1:26379", "sentinel2:26379", "sentinel3:26379"],
  // "sentinel_master_name": "mymaster",

  "client": {
    "token": {
      "hmac_secret_key": "${CENTRIFUGO_TOKEN_SECRET}"
    },
    "expired_close_delay": "25s",
    "expired_sub_close_delay": "25s",
    "proxy": {
      "connect": {
        "enabled": true,
        "endpoint": "http://sentinel-lb/proxy/connect",
        "timeout": "3s",
        "http": {
          "static_headers": {
            "X-Centrifugo-Proxy-Secret": "${CENTRIFUGO_PROXY_SECRET}"
          }
        }
      },
      "refresh": {
        "enabled": true,
        "endpoint": "http://sentinel-lb/proxy/refresh",
        "timeout": "3s",
        "http": {
          "static_headers": {
            "X-Centrifugo-Proxy-Secret": "${CENTRIFUGO_PROXY_SECRET}"
          }
        }
      }
    },
    "include_connection_meta": true
  },

  "channel": {
    "namespaces": [
      {
        "name": "nodes",
        "presence": true,
        "join_leave": true,
        "force_push_join_leave": true,
        "allow_subscribe_for_client": false,
        "subscribe_proxy_enabled": true,
        "subscribe_proxy_name": "default",
        "allow_presence_for_subscriber": true,
        "history_size": 10,
        "history_ttl": "60s",
        "force_recovery": true
      },
      {
        "name": "jobs",
        "allow_subscribe_for_client": false,
        "subscribe_proxy_enabled": true,
        "subscribe_proxy_name": "default",
        "history_size": 100,
        "history_ttl": "600s",
        "force_recovery": true
      },
      {
        "name": "chunks",
        "allow_publish_for_client": false,
        "publish_proxy_enabled": true,
        "publish_proxy_name": "publish"
      }
    ]
  },

  "rpc": {
    "proxy": {
      "enabled": true,
      "endpoint": "http://sentinel-lb/proxy/rpc",
      "timeout": "5s",
      "include_connection_meta": true,
      "http": {
        "static_headers": {
          "X-Centrifugo-Proxy-Secret": "${CENTRIFUGO_PROXY_SECRET}"
        }
      }
    }
  },

  "proxies": [
    {
      "name": "default",
      "endpoint": "http://sentinel-lb/proxy/subscribe",
      "timeout": "3s",
      "include_connection_meta": true,
      "http": {
        "static_headers": {
          "X-Centrifugo-Proxy-Secret": "${CENTRIFUGO_PROXY_SECRET}"
        }
      }
    },
    {
      "name": "publish",
      "endpoint": "http://sentinel-lb/proxy/publish",
      "timeout": "10s",
      "include_connection_meta": true,
      "http": {
        "static_headers": {
          "X-Centrifugo-Proxy-Secret": "${CENTRIFUGO_PROXY_SECRET}"
        }
      }
    }
  ],

  "http_api": {
    "key": "${CENTRIFUGO_API_KEY}"
  },

  "health": {
    "enabled": true
  },

  "prometheus": {
    "enabled": true
  },

  "log_level": "info"
}
```

### Key Configuration Notes

1. **v5 format** - Uses nested structure (`client.proxy`, `channel.namespaces`)
2. **`subscribe_proxy_enabled: true`** - All subscriptions go through sentinel for authorization
3. **`allow_subscribe_for_client: false`** - No implicit channel access (secure by default)
4. **`allow_publish_for_client: false`** - All publishes must be proxied
5. **`force_recovery: true`** - Clients automatically recover missed messages on reconnect
6. **`include_connection_meta: true`** - Required on both client level AND each named proxy to include meta in proxy requests
7. **`presence_hash_field_ttl: true`** - Requires Redis 7.4+, improves presence cleanup
8. **Named proxies** - Different timeouts for subscribe (3s) vs publish (10s)
9. **RPC proxy** - Enables bidirectional request/response (for config fetching)
10. **Health + Prometheus** - Built-in monitoring endpoints

### Disconnect Codes

Use these codes in proxy error responses:

| Code      | Type          | Use Case                      |
| --------- | ------------- | ----------------------------- |
| 4000-4499 | Reconnectable | Temporary errors, rate limits |
| 4500-4999 | Terminal      | Auth failures, invalid state  |

Examples:

- `4429` - Rate limit exceeded (reconnect with backoff)
- `4500` - Chunk not found (terminal, don't retry)
- `4501` - Authentication failed (terminal)

## JWT Token Structure

### Node JWT

```json
{
  "sub": "node-uuid",
  "exp": 1234567890,
  "iat": 1234567800,
  "nbf": 1234567800,
  "jti": "unique-token-id",
  "channels": ["nodes:node-uuid"],
  "info": {
    "type": "node",
    "pubkey_hash": "sha256-of-pubkey"
  }
}
```

**`pubkey_hash` computation:** SHA-256 of the raw 32-byte Ed25519 public key bytes (not the encoded/armored form), hex-encoded. This provides a consistent identifier regardless of key serialization format.

**Note:** The `channels` claim triggers **server-side auto-subscription** on connect, not just authorization. This is intentional - nodes should be subscribed to their channel immediately without client-side subscription calls.

### Portal JWT

```json
{
  "sub": "user-uuid",
  "exp": 1234567890,
  "iat": 1234567800,
  "nbf": 1234567800,
  "jti": "unique-token-id",
  "info": {
    "type": "portal"
  }
}
```

**Token Lifetime:**

- Node JWT: 15 minutes (short-lived, refresh via proxy)
- Portal JWT: 1 hour (refresh via standard auth flow)

**Refresh Flow:**

1. Centrifugo detects token approaching expiration
2. Sends refresh request to `/proxy/refresh`
3. Sentinel validates node still exists, issues new JWT
4. Centrifugo updates client token transparently

## Connection Meta

Connection meta is server-side data attached to a connection that's included in all proxy requests but NOT exposed to the client. This is set in the connect proxy response.

### Setting Meta in Connect Proxy Response

```json
{
  "result": {
    "user": "node-uuid",
    "expire_at": 1234567890,
    "meta": {
      "pubkey_hash": "sha256-of-ed25519-pubkey",
      "node_type": "compute",
      "registered_at": 1234567800
    }
  }
}
```

### Using Meta in Other Proxies

All subsequent proxy requests (subscribe, publish, refresh, rpc) include the meta:

```json
{
  "client": "client-uuid",
  "user": "node-uuid",
  "meta": {
    "pubkey_hash": "sha256...",
    "node_type": "compute",
    "registered_at": 1234567800
  },
  "channel": "chunks:complete",
  "data": { ... }
}
```

### Security Benefits

1. **Not exposed to client** - Sensitive data like pubkey hash isn't sent to browser/node
2. **Set once, used everywhere** - Don't need to include in every JWT
3. **Server-controlled** - Client can't tamper with meta values
4. **Audit trail** - Include `registered_at` for anomaly detection

## Redis Schema

### Keys (with Hash Tags for Future Cluster Compatibility)

| Key                                 | Type    | TTL | Purpose                                                      |
| ----------------------------------- | ------- | --- | ------------------------------------------------------------ |
| `{node}:{id}:state`                 | Hash    | 2h  | `{backlog, last_heartbeat}`                                  |
| `{node}:{id}:chunks`                | Set     | 2h  | Chunk IDs assigned (for reclaim)                             |
| `{node}:backlog:sorted`             | ZSet    | -   | Node selection by lowest backlog                             |
| `{job}:{id}`                        | Hash    | 24h | `{total, completed, config_hash, lock, lock_at, created_at}` |
| `{job}:{id}:results`                | List    | 24h | Chunk results for aggregation                                |
| `{chunk}:{id}`                      | Hash    | 2h  | `{job_id, node_id, iterations, seed_offset, assigned_at}`    |
| `config:{hash}`                     | String  | 7d  | Cached config JSON                                           |
| `ratelimit:publish:{node}:{window}` | Integer | 2s  | Rate limit counter                                           |
| `idempotency:{chunk}:{node}`        | String  | 10m | Prevents duplicate completions                               |

**Note:** Hash tags like `{node}` ensure related keys hash to same slot if we ever migrate to Cluster. Currently using single Redis instance.

### TTL Strategy

- **Node keys (2h):** Refreshed on every heartbeat. Dead nodes naturally expire.
- **Job keys (24h):** Long enough for any reasonable job. Refreshed on chunk completion.
- **Chunk keys (2h):** Should complete within this window. If not, something is wrong.
- **Config keys (7d):** Long-lived, many jobs may reference same config.
- **Idempotency keys (10m):** Covers retry window, then auto-cleanup.

### Lua Scripts

**assign_chunk.lua:**

```lua
-- KEYS[1] = {node}:{node_id}:state
-- KEYS[2] = {node}:{node_id}:chunks
-- KEYS[3] = {chunk}:{chunk_id}
-- KEYS[4] = {node}:backlog:sorted
-- ARGV[1] = node_id
-- ARGV[2] = chunk_id
-- ARGV[3] = job_id
-- ARGV[4] = iterations
-- ARGV[5] = seed_offset
-- ARGV[6] = current_timestamp

local node_state_key = KEYS[1]
local node_chunks_key = KEYS[2]
local chunk_key = KEYS[3]
local backlog_zset = KEYS[4]

local node_id = ARGV[1]
local chunk_id = ARGV[2]
local job_id = ARGV[3]
local iterations = tonumber(ARGV[4])
local seed_offset = tonumber(ARGV[5])
local now = tonumber(ARGV[6])

-- Validate inputs
if not iterations or iterations <= 0 then
    return redis.error_reply('ERR invalid iterations')
end
if not seed_offset or seed_offset < 0 then
    return redis.error_reply('ERR invalid seed_offset')
end

-- Check node is alive (last heartbeat within 2 minutes)
local last_hb = redis.call('HGET', node_state_key, 'last_heartbeat')
if not last_hb or (now - tonumber(last_hb)) > 120 then
    return redis.error_reply('ERR node not healthy')
end

-- Increment backlog
local new_backlog = redis.call('HINCRBY', node_state_key, 'backlog', 1)
redis.call('EXPIRE', node_state_key, 7200) -- 2h

-- Track chunk assignment
redis.call('SADD', node_chunks_key, chunk_id)
redis.call('EXPIRE', node_chunks_key, 7200) -- 2h

-- Create chunk record
redis.call('HSET', chunk_key,
    'job_id', job_id,
    'node_id', node_id,
    'iterations', iterations,
    'seed_offset', seed_offset,
    'assigned_at', now)
redis.call('EXPIRE', chunk_key, 7200) -- 2h

-- Update sorted set for node selection
redis.call('ZADD', backlog_zset, new_backlog, node_id)

return {new_backlog, 'OK'}
```

**complete_chunk.lua:**

```lua
-- KEYS[1] = {chunk}:{chunk_id}
-- KEYS[2] = idempotency:{chunk_id}:{node_id}
-- ARGV[1] = result_json
-- ARGV[2] = node_id (from JWT, trusted)
-- ARGV[3] = current_timestamp

local chunk_key = KEYS[1]
local idempotency_key = KEYS[2]
local result_json = ARGV[1]
local claiming_node = ARGV[2]
local now = tonumber(ARGV[3])

-- CRITICAL: Acquire idempotency lock FIRST using SET NX
-- This prevents partial work if script errors midway
local lock_acquired = redis.call('SET', idempotency_key, '1', 'NX', 'EX', 600)
if not lock_acquired then
    return {'ALREADY_COMPLETED', nil, nil, nil}
end

-- Get chunk data using HMGET (not HGETALL - order not guaranteed!)
local chunk_data = redis.call('HMGET', chunk_key, 'job_id', 'node_id', 'iterations')
if not chunk_data[1] then
    -- Chunk doesn't exist - either already completed or never assigned
    return {'NOT_FOUND', nil, nil, nil}
end

local job_id = chunk_data[1]
local assigned_node = chunk_data[2]

-- Verify the completing node is the assigned node
if assigned_node ~= claiming_node then
    return {'WRONG_NODE', job_id, nil, nil}
end

-- Build keys from job_id
-- NOTE: Dynamic key construction is intentional for single-instance Redis.
-- This pattern is NOT Cluster-compatible but simplifies the caller interface.
-- See "Design Principles" - we explicitly chose single instance/Sentinel over Cluster.
local node_state_key = '{node}:' .. assigned_node .. ':state'
local node_chunks_key = '{node}:' .. assigned_node .. ':chunks'
local job_key = '{job}:' .. job_id
local results_key = '{job}:' .. job_id .. ':results'

-- Decrement node backlog
local new_backlog = redis.call('HINCRBY', node_state_key, 'backlog', -1)
if new_backlog < 0 then
    redis.call('HSET', node_state_key, 'backlog', 0)
    new_backlog = 0
end

-- Update sorted set
redis.call('ZADD', '{node}:backlog:sorted', new_backlog, assigned_node)

-- Remove chunk from node's set (pass chunk_id via ARGV for clarity)
local chunk_id = KEYS[1]:match(':([^:]+)$')
redis.call('SREM', node_chunks_key, chunk_id)

-- Increment job completed counter
local completed = redis.call('HINCRBY', job_key, 'completed', 1)

-- Append result to list
redis.call('RPUSH', results_key, result_json)

-- Refresh TTLs
redis.call('EXPIRE', job_key, 86400) -- 24h
redis.call('EXPIRE', results_key, 86400) -- 24h

-- Delete chunk record
redis.call('DEL', chunk_key)

-- Get total for completion check
local total = tonumber(redis.call('HGET', job_key, 'total')) or 0

-- If this completes the job, try to acquire aggregation lock with timestamp
-- The lock_at timestamp allows detection/recovery of stuck aggregations
local should_aggregate = false
if completed >= total and total > 0 then
    local agg_lock = redis.call('HSETNX', job_key, 'lock', '1')
    if agg_lock == 1 then
        redis.call('HSET', job_key, 'lock_at', now)
        should_aggregate = true
    end
end

return {'OK', job_id, completed, total, should_aggregate and 'AGGREGATE' or nil}
```

**reclaim_chunks.lua:**

```lua
-- KEYS[1] = {node}:{node_id}:state
-- KEYS[2] = {node}:{node_id}:chunks
-- KEYS[3] = {node}:backlog:sorted
-- ARGV[1] = node_id

local node_state_key = KEYS[1]
local node_chunks_key = KEYS[2]
local backlog_zset = KEYS[3]
local node_id = ARGV[1]

-- Get all chunks assigned to this node
local chunks = redis.call('SMEMBERS', node_chunks_key)

-- Clear node state
redis.call('DEL', node_state_key)
redis.call('DEL', node_chunks_key)

-- Remove from backlog sorted set
redis.call('ZREM', backlog_zset, node_id)

-- Return chunks for reassignment
-- Caller must verify each chunk still exists before reassigning
return chunks
```

**heartbeat.lua:**

```lua
-- KEYS[1] = {node}:{node_id}:state
-- KEYS[2] = {node}:backlog:sorted
-- ARGV[1] = node_id
-- ARGV[2] = current_timestamp

local node_state_key = KEYS[1]
local backlog_zset = KEYS[2]
local node_id = ARGV[1]
local now = tonumber(ARGV[2])

-- Update heartbeat timestamp
redis.call('HSET', node_state_key, 'last_heartbeat', now)
redis.call('EXPIRE', node_state_key, 7200) -- 2h

-- Initialize backlog if not exists (use HSETNX to avoid race condition)
redis.call('HSETNX', node_state_key, 'backlog', 0)
local backlog = tonumber(redis.call('HGET', node_state_key, 'backlog')) or 0

-- Update sorted set
redis.call('ZADD', backlog_zset, backlog, node_id)

return {backlog, 'OK'}
```

**select_nodes.lua:**

```lua
-- Select N nodes with lowest backlog that are healthy
-- KEYS[1] = {node}:backlog:sorted
-- ARGV[1] = count (how many nodes to select)
-- ARGV[2] = current_timestamp
-- ARGV[3] = max_backlog (don't select nodes above this)

local backlog_zset = KEYS[1]
local count = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local max_backlog = tonumber(ARGV[3]) or 10

-- Get nodes sorted by backlog (lowest first)
-- Using ZRANGE with BYSCORE (Redis 6.2+) instead of deprecated ZRANGEBYSCORE
local candidates = redis.call('ZRANGE', backlog_zset, 0, max_backlog, 'BYSCORE', 'LIMIT', 0, count * 2)

local selected = {}
for _, node_id in ipairs(candidates) do
    if #selected >= count then break end

    -- Check node health
    -- NOTE: Dynamic key access here is intentional for single-instance Redis
    local last_hb = redis.call('HGET', '{node}:' .. node_id .. ':state', 'last_heartbeat')
    if last_hb and (now - tonumber(last_hb)) <= 120 then
        table.insert(selected, node_id)
    else
        -- Remove unhealthy node from sorted set
        redis.call('ZREM', backlog_zset, node_id)
    end
end

return selected
```

## Data Flows

### 1. Node Registration & Connection

```
Node                      Sentinel                  Redis              Supabase
  │                           │                        │                   │
  │── POST /register ────────►│                        │                   │
  │   {pubkey, signature,     │                        │                   │
  │    timestamp, nonce}      │── verify signature     │                   │
  │                           │── INSERT node ─────────┼──────────────────►│
  │                           │◄───────────────────────┼─── {id} ──────────│
  │◄── {id, claimCode} ───────│                        │                   │
  │                           │                        │                   │
  │── POST /token ───────────►│                        │                   │
  │   {signature, timestamp}  │── verify signature     │                   │
  │                           │── create JWT (15min)   │                   │
  │◄── {jwt, expires_at} ─────│                        │                   │
  │                           │                        │                   │
  │══ WSS beacon ════════════►│                        │                   │
  │   (JWT in handshake)      │                        │                   │
  │                           │                        │                   │
  │   ◄── connect proxy ──────│◄─ POST /proxy/connect ─│                   │
  │       validate JWT claims │                        │                   │
  │       check node exists   │── EVALSHA heartbeat ──►│                   │
  │                           │◄── {backlog, OK} ──────│                   │
  │                           │── return {result: {}}──►                   │
  │                           │                        │                   │
  │── subscribe nodes:{id} ──►│                        │                   │
  │   ◄── subscribe proxy ────│◄─ POST /proxy/subscribe│                   │
  │       verify node owns    │                        │                   │
  │       channel             │── return {result: {}}──►                   │
  │                           │                        │                   │
  │── join nodes:online ─────►│  (presence - automatic)│                   │
```

### 2. Job Creation & Chunk Scheduling

```
Portal              Supabase            Sentinel                 Redis
   │                   │                     │                      │
   │── create_job ────►│                     │                      │
   │   {config, iters} │                     │                      │
   │                   │── pg_notify ───────►│                      │
   │◄── {job_id} ──────│  job_created        │                      │
   │                   │                     │                      │
   │                   │                     │── hash config ───────│
   │                   │                     │── GET config:{hash} ─►│
   │                   │                     │◄── null (miss) ───────│
   │                   │                     │                      │
   │                   │                     │── SET config:{hash} ─►│
   │                   │                     │   EX 604800 (7 days) │
   │                   │                     │                      │
   │                   │                     │── HSET {job}:{id} ───►│
   │                   │                     │   total, config_hash │
   │                   │                     │   created_at         │
   │                   │                     │   EXPIRE 86400       │
   │                   │                     │                      │
   │                   │                     │── EVALSHA select_nodes►│
   │                   │                     │◄── [node1, node2...] ─│
   │                   │                     │                      │
   │                   │                     │   for each chunk:    │
   │                   │                     │── EVALSHA assign_chunk►│
   │                   │                     │── POST Centrifugo ────┼─── push to node
```

### Sentinel Publishing to Nodes

After assigning chunks in Redis, Sentinel pushes assignments to nodes via Centrifugo HTTP API:

**Endpoint:** `POST http://beacon.wowlab.gg/api/publish`
**Auth:** `Authorization: apikey ${CENTRIFUGO_API_KEY}`

**Single publish:**

```json
{
  "channel": "nodes:{node_id}",
  "data": {
    "type": "chunk",
    "id": "chunk-uuid",
    "jobId": "job-uuid",
    "iterations": 1000,
    "configHash": "sha256...",
    "seedOffset": 0
  }
}
```

**Batch publish (for multiple chunks):**

```json
{
  "commands": [
    {"publish": {"channel": "nodes:node-1", "data": {...}}},
    {"publish": {"channel": "nodes:node-2", "data": {...}}}
  ]
}
```

**Critical:** If Centrifugo publish fails, the chunk assignment in Redis is still valid. Sentinel must retry the publish or the node will resync on next connect/heartbeat.

### 3. Chunk Completion (via Publish Proxy)

```
Node                 Centrifugo                Sentinel              Redis
  │                       │                        │                    │
  │── WSS publish ───────►│                        │                    │
  │   channel:            │                        │                    │
  │   chunks:complete     │                        │                    │
  │   {chunkId, result}   │                        │                    │
  │                       │                        │                    │
  │                       │── POST /proxy/publish ─►│                    │
  │                       │   X-Centrifugo-Secret  │                    │
  │                       │   {channel, data,      │                    │
  │                       │    user: "node-uuid"}  │                    │
  │                       │                        │                    │
  │                       │                        │── verify secret    │
  │                       │                        │── rate limit check │
  │                       │                        │                    │
  │                       │                        │── EVALSHA ────────►│
  │                       │                        │   complete_chunk   │
  │                       │                        │◄── {OK, job,       │
  │                       │                        │     5, 10, nil} ───│
  │                       │                        │                    │
  │                       │                        │── POST Centrifugo ─┼─► jobs:{job}
  │                       │                        │   {progress: 5/10} │   (to portal)
  │                       │                        │                    │
  │                       │◄── {result: {}} ───────│                    │
  │◄── publish confirmed ─│                        │                    │
```

**On Publish Proxy Error (e.g., rate limit, chunk not found):**

```json
{
  "error": {
    "code": 1000,
    "message": "chunk not found or already completed"
  },
  "disconnect": {
    "code": 4000,
    "reason": "invalid chunk"
  }
}
```

### 4. Job Completion (with Saga Pattern)

```
Sentinel                     Redis                    Supabase
   │                            │                         │
   │  (complete_chunk returns   │                         │
   │   AGGREGATE flag)          │                         │
   │                            │                         │
   │── LRANGE {job}:{id}:results►│                         │
   │◄── [r1, r2, ... rN] ───────│                         │
   │                            │                         │
   │   (validate result count   │                         │
   │    matches total)          │                         │
   │                            │                         │
   │   (aggregate in memory:    │                         │
   │    mean, std, min, max)    │                         │
   │                            │                         │
   │── UPDATE jobs ─────────────┼────────────────────────►│
   │   SET result, status       │                         │
   │   WHERE id = job_id        │                         │
   │   AND status != 'completed'│  (idempotent upsert)    │
   │   RETURNING id ◄───────────┼─────────────────────────│
   │                            │                         │
   │   (ONLY if Supabase        │                         │
   │    confirmed the update)   │                         │
   │                            │                         │
   │── DEL {job}:{id} ─────────►│                         │
   │── DEL {job}:{id}:results ──►│                         │
   │                            │                         │
   │── POST Centrifugo ─────────┼─────────────────────────┼─► jobs:{id}
   │   {type: "completed",      │                         │   (to portal)
   │    result: {...}}          │                         │
```

**Critical:** Only delete Redis keys AFTER Supabase confirms the write. If Supabase fails, keep Redis data and retry.

### 5. Node Health Monitoring (Heartbeat-Based)

**Background Task Coordination:** With multiple stateless sentinels, background tasks (health monitoring, stuck lock recovery, chunk reclamation) could run redundantly on all instances. While the tasks are idempotent and safe to run concurrently, this wastes resources. Use Redis-based leader election:

```rust
// Leader election for background tasks (30s lease)
let leader_key = "background:leader";
let acquired = redis.set_nx_ex(leader_key, instance_id, 30).await?;
if acquired {
    // This instance is the leader - run background tasks
    run_health_monitor().await;
    run_lock_recovery().await;
    // Refresh lease periodically while running
}
```

```
Sentinel (background task)       Redis                    Centrifugo           Node
   │                               │                          │                  │
   │  (every 30 seconds)           │                          │                  │
   │                               │                          │                  │
   │── ZRANGE {node}:backlog:sorted►│                          │                  │
   │◄── [node1, node2, ...]  ──────│                          │                  │
   │                               │                          │                  │
   │   for each node:              │                          │                  │
   │── HGET {node}:{id}:state ────►│                          │                  │
   │   last_heartbeat              │                          │                  │
   │◄── timestamp ─────────────────│                          │                  │
   │                               │                          │                  │
   │   if now - timestamp > 90s:   │                          │                  │
   │   (node missed 3 heartbeats)  │                          │                  │
   │                               │                          │                  │
   │── EVALSHA reclaim_chunks ────►│                          │                  │
   │◄── [chunk_ids] ───────────────│                          │                  │
   │                               │                          │                  │
   │   (reassign chunks to         │                          │                  │
   │    healthy nodes)             │                          │                  │
   │                               │                          │                  │
   │                               │                          │                  │
   │══════════════════════════════════════════════════════════│                  │
   │   Centrifugo sends ping       │                          │                  │
   │   (every 25s by default)      │                          │── ping ─────────►│
   │                               │                          │◄── pong ─────────│
   │   On pong, Centrifugo calls   │                          │                  │
   │   refresh proxy (if needed)   │                          │                  │
   │◄─────────────────────────────────── POST /proxy/refresh ─│                  │
   │── EVALSHA heartbeat ─────────►│                          │                  │
   │── return new JWT ─────────────┼──────────────────────────►│                  │
```

**Key insight:** Presence is used as a HINT for which nodes might be online, but the authoritative health check is the heartbeat timestamp in Redis. This handles:

- Presence events being lost (at-most-once delivery)
- Network partitions where presence fires but node is still working
- Nodes that connect but never heartbeat

**Scalability Note:** Current design polls Redis for heartbeat timestamps every 30s. At scale (1000+ nodes), consider:

- Push-based presence updates from Centrifugo (subscribe to presence events)
- Coarser trust in join/leave for initial response, heartbeat as confirmation
- Batch heartbeat checks in single MGET instead of per-node HGET

### 6. Node Disconnect (Presence as Hint)

```
Centrifugo              Sentinel                 Redis
     │                       │                      │
     │── presence leave ────►│                      │
     │   {user: node-uuid}   │                      │
     │                       │                      │
     │   (DON'T immediately  │                      │
     │    reclaim - just     │                      │
     │    note the hint)     │                      │
     │                       │                      │
     │                       │── HGET {node}:{id} ─►│
     │                       │   last_heartbeat     │
     │                       │◄── timestamp ────────│
     │                       │                      │
     │   if heartbeat recent │                      │
     │   (< 60s ago):        │                      │
     │   → node might        │                      │
     │     reconnect, wait   │                      │
     │                       │                      │
     │   if heartbeat stale  │                      │
     │   (> 90s ago):        │                      │
     │   → proceed with      │                      │
     │     reclaim           │                      │
     │                       │                      │
     │                       │── EVALSHA ──────────►│
     │                       │   reclaim_chunks     │
     │                       │◄── [chunk_ids] ──────│
     │                       │                      │
     │                       │   for each chunk:    │
     │                       │── EXISTS {chunk}:{id}►│
     │                       │◄── 1 or 0 ───────────│
     │                       │                      │
     │                       │   (only reassign if  │
     │                       │    chunk exists -    │
     │                       │    might have been   │
     │                       │    completed)        │
```

## Node Reconnect & Resync

Centrifugo's `force_recovery: true` with `history_size: 10, history_ttl: 60s` provides limited message recovery. If a node is offline longer than 60s or misses more than 10 messages, it MUST resync from the source of truth.

### Resync via RPC

Nodes call `getAssignedChunks` RPC on connect to recover any missed assignments.

**Flow:** Node → Centrifugo (RPC) → Sentinel (`/proxy/rpc`) → Redis → Sentinel → Centrifugo → Node

**RPC Request:**

```json
{
  "method": "getAssignedChunks",
  "data": {}
}
```

**RPC Response:**

```json
{
  "result": {
    "data": {
      "chunks": [
        {
          "id": "chunk-1",
          "jobId": "job-1",
          "iterations": 1000,
          "configHash": "...",
          "seedOffset": 0
        },
        {
          "id": "chunk-2",
          "jobId": "job-1",
          "iterations": 1000,
          "configHash": "...",
          "seedOffset": 1000
        }
      ]
    }
  }
}
```

**Sentinel RPC Handler:**

```rust
async fn handle_get_assigned_chunks(node_id: &str) -> Vec<ChunkAssignment> {
    let chunk_ids: Vec<String> = redis.smembers(&format!("{{node}}:{}:chunks", node_id)).await?;
    let mut chunks = Vec::new();
    for chunk_id in chunk_ids {
        if let Some(chunk) = redis.hgetall(&format!("{{chunk}}:{}", chunk_id)).await? {
            chunks.push(chunk);
        }
    }
    chunks
}
```

### Design Principle

WebSocket messages are hints, not the source of truth. Redis is authoritative:

- Chunk assignments live in `{node}:{id}:chunks` and `{chunk}:{id}`
- If a node misses a WS message, it calls `getAssignedChunks` RPC (via Centrifugo → Sentinel → Redis)
- Nodes should call `getAssignedChunks` on every connect, not just reconnect

**Important:** Nodes NEVER connect to Redis or Supabase directly. All node communication flows through:

- `wss://beacon.wowlab.gg` (Centrifugo) for WebSocket + RPC
- `https://sentinel.wowlab.gg` (Sentinel) for HTTP (registration, token)

## Message Payloads

### `nodes:{id}` - Chunk Assignment

```json
{
  "type": "chunk",
  "id": "chunk-uuid",
  "jobId": "job-uuid",
  "iterations": 1000,
  "configHash": "sha256...",
  "seedOffset": 0
}
```

### `nodes:{id}` - Heartbeat Ping

```json
{
  "type": "ping",
  "timestamp": 1234567890
}
```

### `nodes:{id}` - Config Update

```json
{
  "type": "config",
  "userId": "user-uuid",
  "name": "My Node",
  "maxParallel": 4
}
```

### `chunks:complete` - Chunk Result (from Node)

```json
{
  "chunkId": "chunk-uuid",
  "result": {
    "meanDps": 12500.5,
    "stdDps": 250.3,
    "minDps": 11800.0,
    "maxDps": 13200.0,
    "iterations": 1000
  }
}
```

### `jobs:{id}` - Progress

```json
{
  "type": "progress",
  "completed": 5,
  "total": 10,
  "timestamp": 1234567890
}
```

### `jobs:{id}` - Completed

```json
{
  "type": "completed",
  "result": {
    "meanDps": 12500.5,
    "stdDps": 250.3,
    "minDps": 11800.0,
    "maxDps": 13200.0,
    "totalIterations": 10000
  }
}
```

## Proxy Request/Response Formats

### Connect Proxy

**Request (Centrifugo → Sentinel):**

```json
{
  "client": "client-uuid",
  "transport": "websocket",
  "protocol": "json",
  "encoding": "json",
  "user": "node-uuid",
  "data": {}
}
```

**Response (Sentinel → Centrifugo):**

```json
{
  "result": {
    "user": "node-uuid",
    "expire_at": 1234567890
  }
}
```

### Subscribe Proxy

**Request:**

```json
{
  "client": "client-uuid",
  "transport": "websocket",
  "protocol": "json",
  "encoding": "json",
  "user": "node-uuid",
  "channel": "nodes:node-uuid"
}
```

**Response (allow):**

```json
{
  "result": {}
}
```

**Response (deny):**

```json
{
  "error": {
    "code": 403,
    "message": "not authorized for this channel"
  }
}
```

### Publish Proxy

**Request:**

```json
{
  "client": "client-uuid",
  "transport": "websocket",
  "protocol": "json",
  "encoding": "json",
  "user": "node-uuid",
  "channel": "chunks:complete",
  "data": {
    "chunkId": "chunk-uuid",
    "result": {...}
  }
}
```

**Response (success):**

```json
{
  "result": {}
}
```

**Response (error):**

```json
{
  "error": {
    "code": 1000,
    "message": "chunk not found"
  }
}
```

### Refresh Proxy

**Request:**

```json
{
  "client": "client-uuid",
  "transport": "websocket",
  "protocol": "json",
  "encoding": "json",
  "user": "node-uuid"
}
```

**Response:**

```json
{
  "result": {
    "expire_at": 1234568790
  }
}
```

### RPC Proxy

**Request (getConfig):**

```json
{
  "client": "client-uuid",
  "transport": "websocket",
  "protocol": "json",
  "encoding": "json",
  "user": "node-uuid",
  "method": "getConfig",
  "data": {
    "hash": "sha256..."
  },
  "meta": {
    "pubkey_hash": "sha256-of-pubkey",
    "node_type": "compute"
  }
}
```

**Response (success):**

```json
{
  "result": {
    "data": {
      "config": { ... },
      "hash": "sha256..."
    }
  }
}
```

**Response (not found):**

```json
{
  "error": {
    "code": 404,
    "message": "config not found"
  }
}
```

## Rate Limiting

### Node Publish Rate Limit

```
Per node: 100 chunk completions per second
Implementation: Lua script for atomic INCR + EXPIRE (fixed window)
```

**rate_limit.lua:**

```lua
-- Atomic rate limit check
-- KEYS[1] = rate limit key
-- ARGV[1] = TTL in seconds
-- ARGV[2] = max requests
-- Returns: current count

local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return count
```

**In `/proxy/publish` handler:**

```rust
let key = format!("ratelimit:publish:{}:{}", node_id, current_second);
let count: u64 = redis.eval_sha(RATE_LIMIT_SHA, &[&key], &[2, 100]).await?;
if count > 100 {
    return ProxyError::RateLimitExceeded;
}
```

**Note:** Using a Lua script ensures atomicity. The previous INCR + EXPIRE pattern had a race condition where EXPIRE could fail after INCR succeeds, causing keys to persist indefinitely. The fixed window approach allows a 2x burst at second boundaries (200 requests in ~20ms), which is acceptable for this use case.

### Node Connection Rate Limit

```
Per IP: 10 connections per minute
Implementation: Redis sliding window
```

## Result Validation

Sentinel validates chunk results before accepting:

```rust
fn validate_result(result: &ChunkResult, expected_iterations: u64) -> Result<()> {
    // Iteration count must match assignment
    if result.iterations != expected_iterations {
        return Err(ValidationError::IterationMismatch);
    }

    // DPS must be within reasonable bounds (0 to 10M)
    if result.mean_dps < 0.0 || result.mean_dps > 10_000_000.0 {
        return Err(ValidationError::DpsOutOfBounds);
    }

    // Std dev must be non-negative and less than mean
    if result.std_dps < 0.0 || result.std_dps > result.mean_dps * 2.0 {
        return Err(ValidationError::StdDevInvalid);
    }

    // Min must be <= mean <= max
    if result.min_dps > result.mean_dps || result.max_dps < result.mean_dps {
        return Err(ValidationError::MinMaxInvalid);
    }

    Ok(())
}
```

## Failure Scenarios (Realistic)

### Sentinel Instance Dies Mid-Request

**Scenario:** Publish proxy request in flight, sentinel crashes.

**What happens:**

- Centrifugo times out (10s), returns error to node
- Node's client SDK sees publish failure
- Node retries with exponential backoff

**Recovery:**

- Idempotency key prevents double-counting if first request partially succeeded
- If chunk completion never happened, node retry will succeed on another sentinel

### Redis Temporarily Unavailable

**Scenario:** Redis down for 30 seconds.

**What happens:**

- All sentinel operations fail
- Centrifugo returns errors to all proxy requests
- Nodes see publish failures, retry with backoff
- Portal sees stale progress (Centrifugo can't publish updates)

**Recovery:**

- When Redis returns, retries succeed
- No data loss (nothing was committed)
- Progress catches up quickly

### Node Disconnects Mid-Chunk

**Scenario:** Node working on chunk, network dies.

**What happens:**

- Centrifugo detects disconnect (ping timeout ~25-30s)
- Presence leave event fires
- Sentinel notes the hint but checks heartbeat timestamp
- If heartbeat also stale (>90s), reclaim begins

**Race condition handled:**

- Node finishes chunk just as disconnect detected
- Publish proxy succeeds (chunk marked complete in Redis)
- Reclaim script finds chunk doesn't exist, skips it

### Duplicate Chunk Completion

**Scenario:** Network glitch causes node to retry publish.

**What happens:**

- First publish succeeds, sets idempotency key, deletes chunk
- Second publish arrives, idempotency key exists
- Returns `ALREADY_COMPLETED` - no double counting

**Scenario:** Chunk reclaimed and completed by new node, old node also completes.

**What happens:**

- Chunk reassigned to Node B
- Node A's late completion: chunk `node_id` doesn't match, rejected
- Only Node B's result counts

### Job Takes Longer Than Expected

**Scenario:** Job runs for 20 hours (complex simulation).

**What happens:**

- Job keys have 24h TTL
- Each chunk completion refreshes TTL
- As long as chunks keep completing, job stays alive
- If no completions for 24h, job data expires (job was abandoned)

### Supabase Write Fails During Aggregation

**Scenario:** Network error writing final result to Supabase.

**What happens:**

- Sentinel has aggregation lock (via Redis HSETNX)
- Supabase write fails
- Sentinel does NOT delete Redis keys
- Sentinel releases lock, retries after backoff

**Recovery:**

- Same sentinel (or another) retries aggregation
- Redis data still intact
- Eventually Supabase write succeeds
- Then Redis cleanup happens

### Multiple Sentinels Detect Job Completion

**Scenario:** Two chunks complete simultaneously, both see `completed == total`.

**What happens:**

- Both run `complete_chunk.lua`
- Both try `HSETNX job:{id} lock 1`
- Only ONE succeeds (Redis atomic)
- Winner aggregates and writes to Supabase
- Loser sees lock already held, does nothing

### Aggregation Lock Gets Stuck

**Scenario:** Sentinel acquires aggregation lock, then crashes before completing.

**What happens:**

- Lock exists with `lock_at` timestamp
- Background job checks for stuck locks (lock_at > 5 minutes ago)
- If found, releases lock by deleting `lock` and `lock_at` fields
- Next chunk completion or background job retries aggregation

**Recovery logic (background task):**

```rust
// Check for stuck aggregation locks every 60 seconds
for job_id in active_jobs {
    let lock_at: Option<i64> = redis.hget(&job_key, "lock_at").await?;
    if let Some(lock_time) = lock_at {
        if now - lock_time > 300 { // 5 minutes
            // Lock is stuck, release it
            redis.hdel(&job_key, &["lock", "lock_at"]).await?;
            log::warn!("Released stuck aggregation lock for job {}", job_id);
        }
    }
}
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTH BOUNDARIES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1 - External (Internet)          LAYER 2 - Internal (VPC)            │
│  ─────────────────────────────          ────────────────────────            │
│                                                                              │
│  Node WSS → Centrifugo                  Centrifugo → Sentinel                │
│    Auth: JWT (15min, refresh)             Auth: Proxy Secret header          │
│    Verified: on connect, refresh                                             │
│                                         Sentinel → Redis                     │
│  Portal WSS → Centrifugo                  Auth: Password (if configured)     │
│    Auth: JWT (1hr)                                                           │
│    Verified: on connect                 Sentinel → Supabase                  │
│                                           Auth: Service role key             │
│  Node HTTP → Sentinel                                                        │
│    Auth: Ed25519 signature              Sentinel → Centrifugo API            │
│    Verified: per request                  Auth: API key                      │
│                                                                              │
│  Portal HTTP → Supabase                                                      │
│    Auth: Supabase JWT                                                        │
│    Verified: RLS policies                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Channel Authorization Matrix

| Channel           | Who Can Subscribe | Who Can Publish    | Enforced By     |
| ----------------- | ----------------- | ------------------ | --------------- |
| `nodes:{id}`      | Only that node    | Only sentinel      | Subscribe proxy |
| `jobs:{id}`       | Job owner only    | Only sentinel      | Subscribe proxy |
| `nodes:online`    | All authenticated | Nobody             | Presence only   |
| `chunks:complete` | Nobody            | Assigned node only | Publish proxy   |

### Proxy Secret Validation

Every proxy endpoint MUST verify:

```rust
fn verify_proxy_secret(req: &Request) -> Result<()> {
    let secret = req.headers()
        .get("X-Centrifugo-Proxy-Secret")
        .ok_or(AuthError::MissingSecret)?;

    if secret != env::var("CENTRIFUGO_PROXY_SECRET")? {
        return Err(AuthError::InvalidSecret);
    }
    Ok(())
}
```

This prevents:

- Direct HTTP access to proxy endpoints
- Spoofing the `user` field

## Monitoring & Alerts

### Key Metrics

**Sentinel Metrics:**

| Metric                       | Alert Threshold | Meaning            |
| ---------------------------- | --------------- | ------------------ |
| `sentinel_proxy_latency_p99` | > 5s            | Proxy too slow     |
| `sentinel_redis_errors`      | > 10/min        | Redis issues       |
| `sentinel_chunk_completions` | < expected      | Processing stalled |
| `node_heartbeat_age_max`     | > 120s          | Nodes going stale  |
| `job_completion_time_p99`    | > expected      | Jobs running slow  |

**Centrifugo Metrics (from Prometheus):**

| Metric                                                | Alert Threshold | Meaning              |
| ----------------------------------------------------- | --------------- | -------------------- |
| `centrifugo_node_num_clients`                         | drop > 20%      | Mass disconnect      |
| `centrifugo_proxy_duration_seconds{type="publish"}`   | p99 > 5s        | Publish proxy slow   |
| `centrifugo_proxy_duration_seconds{type="subscribe"}` | p99 > 1s        | Subscribe proxy slow |
| `centrifugo_proxy_errors_total`                       | > 100/min       | Proxy failures       |
| `centrifugo_broker_redis_pub_sub_errors_total`        | > 0             | Redis pub/sub issues |
| `centrifugo_node_pub_sub_lag_seconds`                 | > 1s            | Message delivery lag |
| `centrifugo_transport_messages_sent_total`            | -               | Throughput baseline  |
| `centrifugo_transport_messages_received_total`        | -               | Throughput baseline  |

### Health Check Endpoint

```
GET /status

{
  "status": "healthy",
  "redis": "connected",
  "centrifugo": "connected",
  "supabase": "connected",
  "metrics": {
    "active_nodes": 42,
    "active_jobs": 5,
    "chunks_per_minute": 1200
  }
}
```

## Migration Path

### Phase 1: Redis Integration

1. Deploy Redis (single instance with persistence)
2. Add `fred` crate to sentinel
3. Implement Lua scripts
4. Add heartbeat tracking alongside existing system
5. Shadow-write to Redis (don't use for decisions yet)

### Phase 2: Centrifugo Proxies

1. Configure Centrifugo proxy endpoints
2. Implement `/proxy/connect` (validation only, no auth changes)
3. Implement `/proxy/subscribe` (authorization)
4. Implement `/proxy/refresh` (token refresh)
5. Test with feature flag

### Phase 3: Chunk Completion via Proxy

1. Implement `/proxy/publish` with full validation
2. Update node to publish via Centrifugo (feature flag)
3. Run both paths in parallel, compare results
4. Switch to proxy path, remove old HTTP endpoint

### Phase 4: Horizontal Scaling

1. Remove in-memory state from sentinel
2. Deploy multiple sentinel instances
3. Configure load balancer
4. Test failover scenarios

### Phase 5: Cleanup

1. Remove old `/chunks/complete` endpoint
2. Remove polling from portal
3. Remove Supabase Realtime integration
4. Archive old code

## Appendix: Node Client SDK Requirements

### Retry Logic

```typescript
class NodeClient {
  private retryConfig = {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  async publishChunkCompletion(chunkId: string, result: ChunkResult) {
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        await this.centrifuge.publish("chunks:complete", { chunkId, result });
        return; // Success
      } catch (error) {
        if (this.isRetryable(error)) {
          const baseDelay = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(2, attempt),
            this.retryConfig.maxDelayMs,
          );
          // Add jitter (0-25% of delay) to prevent thundering herd
          const jitter = Math.random() * baseDelay * 0.25;
          await sleep(baseDelay + jitter);
          continue;
        }
        throw error; // Non-retryable error
      }
    }
    throw new Error("Max retries exceeded");
  }

  private isRetryable(error: any): boolean {
    // Rate limit, temporary errors are retryable
    // Auth errors, chunk not found are not
    return error.code >= 500 || error.code === 429;
  }
}
```

### Token Refresh

```typescript
centrifuge.on("refresh", async (ctx) => {
  // Centrifugo handles refresh automatically via proxy
  // We just need to ensure our heartbeat keeps us alive
  await this.recordHeartbeat();
});
```

### Heartbeat Integration

```typescript
// Heartbeat happens automatically via Centrifugo ping/pong
// Refresh proxy updates Redis heartbeat timestamp
// No explicit heartbeat HTTP calls needed
```

## Centrifugo Features: Used vs Not Used

### Features We Use

| Feature                 | Why                                       |
| ----------------------- | ----------------------------------------- |
| **JWT Authentication**  | Standard auth for WebSocket connections   |
| **Token Refresh Proxy** | Keep long-lived connections alive         |
| **Connect Proxy**       | Validate connections, set connection meta |
| **Subscribe Proxy**     | Channel-level authorization               |
| **Publish Proxy**       | Process chunk completions server-side     |
| **RPC Proxy**           | Config fetching over WebSocket            |
| **Presence**            | Hint for online nodes (not authoritative) |
| **Join/Leave Events**   | Optimization for disconnect detection     |
| **History + Recovery**  | At-least-once delivery within window      |
| **Named Proxies**       | Different timeouts per operation type     |
| **Connection Meta**     | Server-side metadata for security         |
| **Redis Engine**        | Scalable pub/sub backend                  |
| **Prometheus Metrics**  | Monitoring and alerting                   |
| **Health Endpoint**     | Kubernetes readiness/liveness probes      |

### Features We Don't Use (and Why)

| Feature                             | Why Not                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| **Delta Compression**               | Our messages are discrete events, not incremental updates |
| **Unidirectional (SSE)**            | All clients need bidirectional communication              |
| **Server-Side Subscriptions (JWT)** | We use subscribe proxy for dynamic authorization          |
| **Subscription Refresh**            | Connection-level refresh is sufficient                    |
| **Redis Cluster**                   | Lua scripts need multi-key atomicity                      |
| **User Connections API**            | Don't need to manage connections server-side              |
| **Channel Patterns**                | Explicit channel names are clearer                        |
| **Push Notifications**              | Not applicable to our use case                            |

### Features to Consider (Future)

| Feature                 | When                                              |
| ----------------------- | ------------------------------------------------- |
| **Rate Limiting (PRO)** | If publish proxy rate limiting becomes bottleneck |
| **User Limits (PRO)**   | If we need per-user connection limits             |
| **Granular Proxy Mode** | If we need different proxy backends per namespace |
| **Tarantool Engine**    | If Redis becomes performance bottleneck           |
| **GRPC Transport**      | If we have internal GRPC services                 |
