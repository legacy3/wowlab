# Quick Start Guide

Follow phases sequentially. Each phase is independently testable in `apps/standalone`.

## Overview

**Goal:** Rewrite to 4 clean packages with zero `@ts-ignore` comments.

**Strategy:** Build alongside old packages, test each phase, then migrate apps.

## New Package Structure

```
@wowlab/
  core/        # Schemas + Domain (merge 2 → 1)
  services/    # Service interfaces + implementations
  rotation/    # Rotation DSL
  runtime/     # Composition root (clean, no @ts-ignore)
```

**Result:** 7 packages → 4 packages, zero `@ts-ignore`, pluggable services

## Phases

### Foundation (Phases 1-2)

1. **[Phase 1](phases/phase-01.md)** - Create `@wowlab/core` package
   - Merge schemas + domain + entities
   - Test: Package builds, exports work

2. **[Phase 2](phases/phase-02.md)** - Create service interfaces
   - Define all Context.Tag interfaces
   - Test: Package builds, no implementations yet

### Core Services (Phases 3-4)

3. **[Phase 3](phases/phase-03.md)** - Implement State, Log, RNG
   - Build core service implementations
   - Test: Services work in isolation

4. **[Phase 4](phases/phase-04.md)** - Implement Metadata + SpellData
   - InMemoryMetadata for testing
   - Test: Metadata loads mock spells

### Business Logic (Phases 5-6)

5. **[Phase 5](phases/phase-05.md)** - Implement Accessors + Unit/Spell services
   - Use `Effect.Service` with dependencies
   - Test: CRUD operations work, no @ts-ignore

6. **[Phase 6](phases/phase-06.md)** - Implement Simulation orchestration
   - SimulationService with event loop
   - Test: Simulation runs, processes events

### Integration (Phases 7-9)

7. **[Phase 7](phases/phase-07.md)** - **CRITICAL** - Create `@wowlab/runtime`
   - Clean `createAppLayer()` with **ZERO @ts-ignore**
   - Test: All services compose correctly

8. **[Phase 8](phases/phase-08.md)** - Create `@wowlab/rotation`
   - Rotation actions and context
   - Test: Rotation DSL works

9. **[Phase 9](phases/phase-09.md)** - Full standalone integration
   - Complete simulation using only new packages
   - Test: Compare with old implementation

## Time Estimates

- Phases 1-2: 2-3 hours (foundation)
- Phases 3-4: 3-4 hours (core services)
- Phases 5-6: 4-5 hours (business logic)
- Phases 7-9: 3-4 hours (integration)

**Total: ~15 hours** of focused implementation

## Verification at Each Phase

Every phase ends with:
```bash
cd apps/standalone
pnpm dev src/new/phase-XX-test.ts
```

If it works, move to next phase. If not, fix before proceeding.

## Success Criteria

Phase 9 complete when:
- ✅ Full simulation runs in standalone
- ✅ **ZERO `@ts-ignore` in entire `@wowlab/*` codebase**
- ✅ Services compose cleanly
- ✅ Metadata is pluggable
- ✅ Output matches old implementation

## After Completion

1. Migrate `apps/portal` to `@wowlab/*`
2. Migrate `apps/cli` to `@wowlab/*`
3. Delete `@packages/innocent-*` packages
4. Update CLAUDE.md with new architecture

## Rollback

Old packages remain untouched. If new implementation fails:
- Keep using `@packages/innocent-*`
- Fix `@wowlab/*` packages
- Only migrate apps when stable

Zero risk to existing functionality.
