# WowLab Rewrite Plan

Phase-by-phase implementation of new `@wowlab/*` packages alongside existing `@packages/innocent-*` packages.

## Goals

1. **Zero `@ts-ignore`** - Proper Effect-TS service composition
2. **Cleaner structure** - 4 packages instead of 7
3. **Pluggable services** - Any service can be swapped (not just metadata)
4. **Testable phases** - Each phase verifiable in `apps/standalone`

## New Package Structure

```
@wowlab/
  core/       # Schemas + Domain + Core runtime (merge schemas + domain)
  services/   # Service interfaces + implementations
  rotation/   # Rotation DSL and execution
  runtime/    # Composition root (clean AppLayer, no @ts-ignore)
```

## Migration Strategy

- Build new packages alongside old ones
- Test each phase in `apps/standalone` before moving to next
- Old packages remain untouched during implementation
- Once complete, apps can migrate one at a time

## Phases

1. **Phase 1** - `@wowlab/core` foundation
2. **Phase 2** - Service interfaces
3. **Phase 3** - Core services (State, Log, RNG)
4. **Phase 4** - Metadata + SpellData services
5. **Phase 5** - Business services (Unit, Spell, Lifecycle)
6. **Phase 6** - Simulation orchestration
7. **Phase 7** - Runtime composition (NO @ts-ignore)
8. **Phase 8** - Rotation API
9. **Phase 9** - Full standalone integration

## Verification

Each phase ends with a working `apps/standalone` test that proves the new code works.

## Timeline

Each phase should be:

- Small enough to implement in one session
- Independently testable
- Builds on previous phases

Start with `phases/phase-01.md`.
