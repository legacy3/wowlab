# Phase 3: Handler Integration

Goal: wire CLEU aura handlers to use `AuraDataFlat` and the Event Queue, keeping runtime aura entities minimal. This phase is where game events line up with scheduling.

Prereqs: Phases 1-2; emitter stamps `event.timestamp` per `docs/wowlab/00-data-flow.md`.

## Runtime Contract

- `config.auras` supplies static data; handlers must not mutate it.
- `GameState.units[].auras` holds only CLEU-visible fields.
- Scheduler (`emitter.emitAt`) is the sole owner of expirations and tick cadence.

## Apply Flow (`SPELL_AURA_APPLIED`)

1. Add aura to state with `{ casterUnitId, spellId, stacks: 1 }`.
2. If `baseDurationMs > 0`, schedule removal: `emitAt(baseDurationMs, SPELL_AURA_REMOVED)`.
3. If periodic (`periodicType` and `tickPeriodMs > 0`):
   - Compute `tickPeriodMs` snapshot (apply haste when `hastedTicks`).
   - `firstTickDelay = auraData.tickOnApplication ? 0 : tickPeriodMs`.
   - Schedule tick event with `_tag` matching periodicType (heal → SPELL_PERIODIC_HEAL; damage/other → SPELL_PERIODIC_DAMAGE) and include `tickPeriodMs` in payload. Snapshot stays in payload, not on entity.

## Refresh Flow (`SPELL_AURA_REFRESH`)

- Compute remaining time from pending removal event (helper like `getPendingRemovalMs`).
- New duration =
  - `pandemic`: `baseDurationMs + min(remainingMs, baseDurationMs * 0.3)`
  - otherwise: `baseDurationMs` (full replace)
- Schedule new removal; old removal becomes stale because handler checks `getAura` before deleting.
- Do **not** touch tick cadence; periodic events already queued keep firing until the aura disappears.

## Remove Flow (`SPELL_AURA_REMOVED`)

- If aura missing → stale event → return.
- Delete aura from state. Any pending ticks naturally stop because future tick handlers won’t find the aura.

## Dose Handlers

- `SPELL_AURA_APPLIED_DOSE` / `SPELL_AURA_REMOVED_DOSE`: update `stacks`, capped by `auraData.maxStacks` when present.

## Forced Removal (dispel/death/cancel)

- Delete aura immediately; emit CLEU removal at `emitAt(0, SPELL_AURA_REMOVED)`.
- Scheduled removals/ticks go stale via missing aura check.

Next: Phase 4 (06-phase4-periodic-ticks.md) for tick-specific details.
