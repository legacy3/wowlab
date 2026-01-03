# Merge Plan: feat-engine-improvements → main

## Summary

This branch introduces the distributed simulation architecture with Rhai-based rotation scripting, a refactored node system (GUI + headless), and Supabase edge functions for job coordination.

---

## Changes by Area

### Engine (Rust)
- Rhai scripting engine replacing WASM-based rotations
- CLI interface for direct simulation runs
- Detailed action logging and reporting
- Parallel execution support
- Performance optimizations (inline hints, refactored resets)
- Beast Mastery hunter spec (Rhai rotations + TOML config)
- Enhanced benchmarking with CPU info and scaling analysis
- HTML results viewer

### Distributed Simulation Nodes
- Split into `node-core`, `node-gui`, `node-headless` crates
- Background auto-update with modal notifications
- Docker support (multi-arch: amd64 + arm64)
- Total cores tracking for CPU management
- Improved worker pool and state management

### Portal (Frontend)
- Distributed simulation hook (`use-distributed-simulation.ts`)
- Rust config builder (`rust-config-builder.ts`)
- Node management UI (selection, bulk actions, sorting)
- Node settings modal (replaced sheet)
- User rotations table component
- Account pages refactor
- Updated loading states

### Supabase Functions
- `chunk-claim`, `chunk-complete` - chunk lifecycle
- `config-fetch`, `config-upsert` - config storage
- `job-create` - job creation
- `node-heartbeat`, `node-register` - node lifecycle
- `rotation-fetch` - rotation script delivery
- `icons`, `talent-atlas` - asset serving

### CI/CD
- Docker image renamed to `wowlab-node`
- Pinned runner versions
- Multi-arch Docker builds
- Consolidated workflows into `ci.yml`

### Versions
- v0.2.1, v0.2.2, v0.2.3, v0.2.4

---

## Pre-Merge Checklist

### Code Quality
- [x] Remove intermediate planning/documentation files
- [x] Remove AI-generated comments (obvious boilerplate)
- [x] Rust code follows idiomatic patterns (clippy clean)
- [x] TypeScript code follows project conventions
- [x] No duplicate/redundant code (DRY)

### Testing
- [x] `cargo test` passes in `crates/engine`
- [x] `cargo clippy` has no warnings (minor: 1 too_many_arguments)
- [x] `pnpm build` succeeds
- [x] `pnpm lint` passes (pre-existing warnings in unrelated files)

### Documentation
- [x] CLAUDE.md files are accurate
- [x] User-facing docs are current
- [x] No orphaned/outdated docs

### Final
- [ ] Clean git history (squash if needed)
- [ ] PR description complete
- [ ] Ready for review
