# node

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

Shared library for distributed simulation nodes. Used by `node-gui` and `node-headless` binaries.

## Architecture

```
src/
  auth.rs      - Ed25519 keypair and request signing (implements RequestSigner)
  cache.rs     - Local caching for rotation scripts and configs
  claim.rs     - Node claiming/pairing with user accounts
  config.rs    - Node configuration management
  core.rs      - NodeCore: main event loop and state machine
  queries.rs   - Typed PostgREST query helpers (configs, rotations)
  realtime.rs  - Realtime subscriptions (node updates, chunks, presence)
  sentinel.rs  - Signed HTTP client for sentinel operations
  update.rs    - Self-update via GitHub releases
  utils/       - Utility functions (backoff, cpu, logging)
  worker/      - Worker pool for parallel simulation execution
```

## Key Types

- `NodeCore` - Main node controller with event-driven architecture
- `NodeConfig` - Persistent configuration (node ID, claimed user, etc.)
- `WorkerPool` - Manages simulation workers across CPU cores
- `SentinelClient` - Signed HTTP client for sentinel node operations
- `NodeRealtime` - Realtime subscription manager with auto-reconnect
- `NodeStats` - Runtime statistics (jobs, throughput, CPU usage)

## Node Lifecycle

1. **Registering** - Initial registration with server
2. **Claiming** - Display pairing code, wait for user claim
3. **Running** - Listen for work via Supabase Realtime, process chunks

## Dependencies

- `wowlab-engine` - Core simulation engine (with JIT)
- `wowlab-supabase` - Supabase client (PostgREST + Realtime)
- `wowlab-types` - Shared type definitions
- `tokio` / `tokio-util` - Async runtime + CancellationToken
- `reqwest` - HTTP client (for sentinel requests)
- `ed25519-dalek` - Ed25519 signatures for node auth
- `moka` - Local cache for configs/rotations
- `self_update` - Auto-update from GitHub releases
