# Modifier Implementation Plan (reordered by reliability)

## Current State

```
✅ Event scheduler infrastructure
✅ Spell lifecycle service
✅ Modifier type definitions
⚠️ CastQueueService (stale spell access, missing cast cleanup)
❌ Resource consumption
❌ Damage application
❌ Modifiers wired into rotation
```

---

## Phase 1 — High‑confidence fixes (must do first)

- Recompute spells on access to avoid stale `isReady`:
  - `packages/wowlab-services/src/internal/accessors/SpellAccessor.ts` → `spell.with({}, gameState.currentTime)` before returning.
  - `packages/wowlab-services/src/internal/castQueue/CastQueueService.ts` → recompute the spell fetched from state with `currentState.currentTime`.
- Cast state bookkeeping:
  - When starting a cast, set `isCasting=true`, `castingSpellId`, `castRemaining=castTime`, `castTarget=targetId`.
  - On `SPELL_CAST_COMPLETE`, clear `isCasting`, `castingSpellId`, `castRemaining`, `castTarget`.
- Reschedule APL after projectile impacts: include `PROJECTILE_IMPACT` in the APL trigger list in `SimulationService.ts`.

## Phase 2 — Event execution reliability

- `scheduleInput` currently forces `execute: Effect.void`; callbacks for charge/projectile/auras won’t run.
- Choose and implement one pattern:
  1) Extend `ScheduledInput`/`buildEvent` to accept an `execute` effect; or
  2) Replace `scheduleInput` usages with `schedule(...)` that sets `id`, `priority`, and `execute`.
- Apply to:
  - `SPELL_CHARGE_READY`: increment charges in the execute handler.
  - `PROJECTILE_IMPACT`: run damage + onDamage pipeline.
  - (Optional) `AURA_EXPIRE` / `AURA_STACK_DECAY`: remove/decay auras.

## Phase 3 — Resource correctness

- Add `UnitService.consumePower(unitId, powerType, amount)` with clamping at 0 and state update.
- Ensure player units are initialized with the needed power entry (mana) before consumption.
- Add `ConsumeSpellResource` modifier that deducts mana via `consumePower`.

## Phase 4 — Damage pipeline

- Implement `CombatService.calculateBaseDamage` (port from `packages/innocent-services/src/internal/combat/`).
- In projectile impact execute handler: call `UnitService.health.damage(targetId, damage)` and then `SpellLifecycleService.executeOnDamage`.
- Add `LaunchSpellProjectile` modifier to schedule impact events using the combat calculation.

## Phase 5 — Modifier API alignment

- Current `SpellModifier` only receives `(spell)`; resource/projectile modifiers need caster (and optionally target).
- Broaden modifier and lifecycle signatures to pass at least `casterId` (and target when available), then update modifiers and lifecycle calls accordingly.

## Phase 6 — Rotation and ID consistency

- Target IDs: CastQueue defaults to `enemy-1`, but the runner creates `enemy`; pick one and use consistently in scheduler payloads and enemy creation.
- Attach modifiers to actual rotation spells (`apps/standalone/src/rotations/beast-mastery.ts`): Cobra Shot, Barbed Shot, Kill Command, Bestial Wrath (current rotation set). Include the new resource/projectile modifiers after Phase 5.
- Use the runnable command: `pnpm --filter @apps/standalone start -- run beast-mastery` (after required builds).

---

## File Map (by phase)

- Phase 1: `packages/wowlab-services/src/internal/accessors/SpellAccessor.ts`, `.../castQueue/CastQueueService.ts`, `.../simulation/SimulationService.ts`
- Phase 2: `.../scheduler/EventSchedulerService.ts`, callers of `scheduleInput`
- Phase 3: `.../unit/UnitService.ts`, `.../modifiers/shared/ConsumeSpellResource.ts` (new), `.../modifiers/shared/index.ts`
- Phase 4: `.../combat/CombatService.ts` (new) + `.../combat/index.ts`, `.../modifiers/shared/LaunchSpellProjectile.ts` (new)
- Phase 5: `packages/wowlab-core/src/internal/entities/types/SpellModifier.ts`, `.../lifecycle/SpellLifecycleService.ts`, affected modifiers
- Phase 6: `apps/standalone/src/rotations/beast-mastery.ts`, any target-id defaults

---

## Open decision (blocker for Phase 2)

- Event API direction: extend `scheduleInput` to carry `execute`, or standardize on `schedule(...)`. Decide once and apply everywhere before wiring new handlers.
