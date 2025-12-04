# Spec Organization Architecture

Research and options for sustainably organizing class/spec modules in wowlab.

---

## Current State

**Beast Mastery handlers** live in `apps/standalone/src/handlers/beast-mastery.ts`:

- Single file with spell IDs, constants, handlers, and registration
- Uses `CombatLogService.EventHandler<E>` type
- Registers via `combatLog.on({ spellId, subevent }, handler, { id, priority })`
- Emits follow-up events via `Emitter` (doesn't mutate state directly)

**Problem**: This doesn't scale. We need to support 39 specs across 13 classes.

---

## SimC Reference Architecture

SimC organizes ~50k lines of class code with these patterns:

### File Organization

| Pattern            | Classes                                                     | Rationale                                                                                |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Single file        | Hunter, Mage, Warrior, Shaman, DK, DH, Evoker, Druid, Rogue | Specs share enough code that splitting isn't worth it                                    |
| Folder with splits | Monk, Paladin, Priest, Warlock                              | Tank/healer/DPS modes differ significantly, or pet/action complexity warrants separation |

### Shared Patterns

1. **`module_t` interface** - Uniform lifecycle (`create_player`, `init`, `combat_begin`)
2. **Nested structs** - `specs_t`, `buffs_t`, `cooldowns_t`, `gains_t`, `procs_t`
3. **Per-target state** - `target_specific_t<T>` for dots/debuffs
4. **Templated action base** - `hunter_action_t` injects shared hooks
5. **APL separation** - Text files → generated includes, not hand-coded

### Key Insight

SimC puts **all specs for a class in one translation unit** unless there's a compelling reason to split. The `specs_t` struct holds spec-wide data, and spec-specific code gates on the active spec.

---

## Proposed Options

### Option A: Single Package Per Class

```
packages/
  wowlab-hunter/
    src/
      index.ts              # exports registerHunterHandlers
      constants.ts          # spell IDs, shared constants
      shared/
        pet.ts              # shared pet utilities
        focus.ts            # focus economy helpers
      beast-mastery/
        handlers.ts         # BM spell handlers
        procs.ts            # BM proc handlers
        index.ts            # registerBMHandlers
      marksmanship/
        handlers.ts
        index.ts
      survival/
        handlers.ts
        index.ts
```

**Pros:**

- Clear ownership per class
- Internal sharing (pet logic, focus) stays private
- Matches SimC's "one class, one unit" philosophy
- Each class can have its own dependencies

**Cons:**

- 13 packages to maintain
- Cross-class sharing (e.g., all hunters share nothing with mages) needs coordination
- More package.json / tsconfig boilerplate

---

### Option B: Single `wowlab-specs` Package

```
packages/
  wowlab-specs/
    src/
      index.ts              # exports all class registrations
      shared/
        damage-pipeline.ts  # AP scaling, mastery, crit formulas
        dot-scheduler.ts    # periodic damage scheduling
        proc-system.ts      # RPPM, chance-based procs
      hunter/
        index.ts            # registerHunterHandlers
        constants.ts
        shared/
          pet.ts
          focus.ts
        beast-mastery/
          index.ts
          handlers.ts
        marksmanship/
          index.ts
        survival/
          index.ts
      mage/
        index.ts
        constants.ts
        arcane/
        fire/
        frost/
      # ... other classes
```

**Pros:**

- Single package, simpler dependency management
- Shared utilities (`damage-pipeline.ts`) available to all specs
- Easier to enforce consistent patterns
- One build, one test suite

**Cons:**

- Large package (could be 50k+ lines eventually)
- All specs rebuild when any spec changes
- Harder to have class-specific dependencies

---

### Option C: `wowlab-specs` + Shared in Services

```
packages/
  wowlab-services/
    src/
      internal/
        combat-log/
          handlers/           # existing state mutations
          shared/             # NEW: shared spec utilities
            DamagePipeline.ts
            DotScheduler.ts
            ProcSystem.ts
            PetManager.ts

  wowlab-specs/
    src/
      hunter/
        beast-mastery.ts
        marksmanship.ts
        survival.ts
        index.ts
      # ... other classes (flat structure, one file per spec)
```

**Pros:**

- Shared systems live in services (already the pattern)
- Specs are thin: just handler registrations
- Flat structure, easy to navigate
- Shared utilities are tested/versioned with services

**Cons:**

- Blurs the line between "simulation infrastructure" and "game mechanics"
- Services package grows significantly
- Specs depend on services for shared logic (circular concern)

---

### Option D: Layered Architecture

```
packages/
  wowlab-mechanics/           # NEW: game mechanics, no simulation
    src/
      damage/
        pipeline.ts           # AP × coeff × mods
        armor.ts              # armor mitigation tables
        crit.ts               # crit multipliers
      resources/
        focus.ts              # focus regen, costs
        mana.ts
        rage.ts
      dots/
        scheduler.ts
        pandemic.ts
      pets/
        scaling.ts
        abilities.ts
      procs/
        rppm.ts
        ppm.ts

  wowlab-specs/
    src/
      hunter/
        constants.ts          # spell IDs
        beast-mastery.ts      # handlers using mechanics
        marksmanship.ts
        survival.ts
```

**Pros:**

- Clean separation: mechanics vs simulation vs specs
- Mechanics package is pure functions, highly testable
- Specs become thin orchestration layers
- Mechanics could be reused outside simulation (tooltips, UI)

**Cons:**

- Three packages instead of one
- More abstraction layers
- May be over-engineered for current needs

---

### Option E: Keep in Standalone (Recommended Starting Point)

```
apps/standalone/
  src/
    specs/                    # renamed from handlers/
      index.ts                # registerAllSpecs()
      shared/
        damage.ts             # damage calculation helpers
        procs.ts              # proc utilities
      hunter/
        index.ts              # registerHunterHandlers
        constants.ts
        beast-mastery.ts
        marksmanship.ts
        survival.ts
      mage/
        index.ts
        constants.ts
        arcane.ts
        fire.ts
        frost.ts
```

**Pros:**

- No new packages needed
- Can iterate quickly
- Extract to package later when patterns stabilize
- Matches current working code

**Cons:**

- Tied to standalone app
- Can't be reused by portal without extraction
- May grow unwieldy

---

## Boilerplate Reduction Utilities

The current BM handlers have significant repetition. Here's how to cut it by 70%+:

### 1. Event Factories

```typescript
// packages/wowlab-specs/src/shared/events.ts

import { CombatLog } from "@wowlab/core/Schemas";

interface DamageOptions {
  spellId: number;
  spellName: string;
  school?: number; // default: 1 (Physical)
  sourceOverride?: {
    // for pet attacks
    guid: string;
    name: string;
  };
}

/** Create SpellDamage from a cast event with minimal config */
export const createDamage = (
  event: CombatLog.SpellCastSuccess,
  opts: DamageOptions,
): CombatLog.SpellDamage =>
  new CombatLog.SpellDamage({
    // Inherit from trigger event
    destFlags: event.destFlags,
    destGUID: event.destGUID,
    destName: event.destName,
    destRaidFlags: event.destRaidFlags,
    sourceFlags: event.sourceFlags,
    sourceGUID: opts.sourceOverride?.guid ?? event.sourceGUID,
    sourceName: opts.sourceOverride?.name ?? event.sourceName,
    sourceRaidFlags: event.sourceRaidFlags,
    timestamp: event.timestamp,
    hideCaster: false,
    // Spell-specific
    spellId: opts.spellId,
    spellName: opts.spellName,
    spellSchool: opts.school ?? 1,
    // Defaults (damage pipeline fills these later)
    amount: 0,
    absorbed: null,
    blocked: null,
    critical: false,
    crushing: false,
    glancing: false,
    isOffHand: false,
    overkill: -1,
    resisted: null,
    school: opts.school ?? 1,
  });

interface AuraOptions {
  spellId: number;
  spellName: string;
  auraType: "BUFF" | "DEBUFF";
  target?: "source" | "dest"; // default: "source"
  stacks?: number;
}

/** Create SpellAuraApplied from a cast event */
export const createAura = (
  event: CombatLog.SpellCastSuccess,
  opts: AuraOptions,
): CombatLog.SpellAuraApplied => {
  const toSource = opts.target !== "dest";
  return new CombatLog.SpellAuraApplied({
    timestamp: event.timestamp,
    sourceFlags: event.sourceFlags,
    sourceGUID: event.sourceGUID,
    sourceName: event.sourceName,
    sourceRaidFlags: event.sourceRaidFlags,
    destFlags: toSource ? event.sourceFlags : event.destFlags,
    destGUID: toSource ? event.sourceGUID : event.destGUID,
    destName: toSource ? event.sourceName : event.destName,
    destRaidFlags: toSource ? event.sourceRaidFlags : event.destRaidFlags,
    hideCaster: false,
    spellId: opts.spellId,
    spellName: opts.spellName,
    spellSchool: 1,
    auraType: opts.auraType,
    amount: opts.stacks ?? null,
  });
};

interface SummonOptions {
  spellId: number;
  spellName: string;
  petName: string;
  petGuid?: string; // auto-generated if not provided
}

/** Create SpellSummon from a cast event */
export const createSummon = (
  event: CombatLog.SpellCastSuccess,
  opts: SummonOptions,
): CombatLog.SpellSummon =>
  new CombatLog.SpellSummon({
    timestamp: event.timestamp,
    sourceFlags: event.sourceFlags,
    sourceGUID: event.sourceGUID,
    sourceName: event.sourceName,
    sourceRaidFlags: event.sourceRaidFlags,
    destFlags: 0,
    destGUID: opts.petGuid ?? `Creature-0-0-0-0-${opts.spellId}-${Date.now()}`,
    destName: opts.petName,
    destRaidFlags: 0,
    hideCaster: false,
    spellId: opts.spellId,
    spellName: opts.spellName,
    spellSchool: 1,
  });
```

### 2. Handler Definition Type

```typescript
// packages/wowlab-specs/src/shared/types.ts

import { CombatLog } from "@wowlab/core/Schemas";
import type { Emitter } from "@wowlab/services/CombatLog";
import * as Effect from "effect/Effect";

export interface SpellHandler {
  id: string; // e.g., "bm:kill-command"
  spellId: number;
  subevent: CombatLog.CombatLogSubevent; // usually "SPELL_CAST_SUCCESS"
  priority?: number; // default: 10
  requiresTarget?: boolean; // adds guard automatically
  handler: (
    event: CombatLog.SpellCastSuccess,
    emitter: Emitter,
  ) => Effect.Effect<void>;
}

export interface SpecDefinition {
  id: string; // e.g., "hunter:beast-mastery"
  name: string; // e.g., "Beast Mastery"
  class: string; // e.g., "hunter"
  handlers: SpellHandler[];
}
```

### 3. Registration Helper

```typescript
// packages/wowlab-specs/src/shared/register.ts

import * as CombatLogService from "@wowlab/services/CombatLog";
import * as Effect from "effect/Effect";
import type { SpellHandler, SpecDefinition } from "./types.js";

/** Wrap handler with target guard if needed */
const withGuard = (h: SpellHandler): SpellHandler["handler"] =>
  h.requiresTarget
    ? (event, emitter) =>
        event.destGUID && event.destName
          ? h.handler(event, emitter)
          : Effect.logDebug(`[${h.id}] No target - skipping`)
    : h.handler;

/** Register all handlers for a spec */
export const registerSpec = (
  spec: SpecDefinition,
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.gen(function* () {
    const combatLog = yield* CombatLogService.CombatLogService;

    for (const h of spec.handlers) {
      yield* combatLog.on(
        { spellId: h.spellId, subevent: h.subevent },
        withGuard(h),
        { id: h.id, priority: h.priority ?? 10 },
      );
    }

    yield* Effect.logInfo(
      `[${spec.id}] Registered ${spec.handlers.length} handlers`,
    );
  });

/** Register multiple specs */
export const registerSpecs = (
  specs: SpecDefinition[],
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.all(specs.map(registerSpec), { discard: true });
```

### 4. Spec Constants Pattern

```typescript
// packages/wowlab-specs/src/hunter/constants.ts

export const HunterSpells = {
  // Shared
  KILL_SHOT: 53351,

  // Beast Mastery
  BARBED_SHOT: 217200,
  BESTIAL_WRATH: 19574,
  CALL_OF_THE_WILD: 359844,
  COBRA_SHOT: 193455,
  KILL_COMMAND: 34026,
  MULTI_SHOT: 2643,

  // Buffs
  BARBED_SHOT_BUFF: 246152,
  BEAST_CLEAVE: 268877,
  FRENZY: 272790,
} as const;

export const HunterCosts = {
  COBRA_SHOT: 35,
  KILL_COMMAND: 30,
  MULTI_SHOT: 40,
} as const;
```

### 5. Resulting Handler (5 lines vs 40)

**Before (40 lines):**

```typescript
const onKillCommandCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    if (!event.destGUID || !event.destName) {
      yield* Effect.logDebug(`[BM] Kill Command cast but no target`);
      return;
    }
    const damageEvent = new CombatLog.SpellDamage({
      absorbed: null,
      amount: 0,
      blocked: null,
      critical: false,
      crushing: false,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      glancing: false,
      hideCaster: false,
      isOffHand: false,
      overkill: -1,
      resisted: null,
      school: 1,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: "Pet",
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.PET_KILL_COMMAND,
      spellName: "Kill Command",
      spellSchool: 1,
      timestamp: event.timestamp,
    });
    emitter.emit(damageEvent);
    yield* Effect.logDebug(`[BM] Kill Command damage`);
  });
```

**After (5 lines):**

```typescript
const killCommand: SpellHandler = {
  id: "bm:kill-command",
  spellId: HunterSpells.KILL_COMMAND,
  subevent: "SPELL_CAST_SUCCESS",
  requiresTarget: true,
  handler: (event, emitter) =>
    Effect.gen(function* () {
      emitter.emit(
        createDamage(event, {
          spellId: HunterSpells.PET_KILL_COMMAND,
          spellName: "Kill Command",
          sourceOverride: { guid: event.sourceGUID, name: "Pet" },
        }),
      );
    }),
};
```

### 6. Full Spec File Example

```typescript
// packages/wowlab-specs/src/hunter/beast-mastery.ts

import { createAura, createDamage, createSummon } from "../shared/events.js";
import type { SpecDefinition, SpellHandler } from "../shared/types.js";
import { HunterSpells } from "./constants.js";

const handlers: SpellHandler[] = [
  {
    id: "bm:bestial-wrath",
    spellId: HunterSpells.BESTIAL_WRATH,
    subevent: "SPELL_CAST_SUCCESS",
    handler: (e, emit) =>
      Effect.sync(() =>
        emit.emit(
          createAura(e, {
            spellId: HunterSpells.BESTIAL_WRATH,
            spellName: "Bestial Wrath",
            auraType: "BUFF",
          }),
        ),
      ),
  },
  {
    id: "bm:kill-command",
    spellId: HunterSpells.KILL_COMMAND,
    subevent: "SPELL_CAST_SUCCESS",
    requiresTarget: true,
    handler: (e, emit) =>
      Effect.sync(() =>
        emit.emit(
          createDamage(e, {
            spellId: HunterSpells.PET_KILL_COMMAND,
            spellName: "Kill Command",
            sourceOverride: { guid: e.sourceGUID, name: "Pet" },
          }),
        ),
      ),
  },
  // ... more handlers, each ~8 lines
];

export const BeastMastery: SpecDefinition = {
  id: "hunter:beast-mastery",
  name: "Beast Mastery",
  class: "hunter",
  handlers,
};
```

---

## Shared Components (Regardless of Option)

These need to exist somewhere:

### 1. Damage Pipeline

```typescript
interface DamageCalculation {
  base: number;           // from spell data
  apCoefficient: number;  // from spell effect
  attackPower: number;    // from unit
  modifiers: Modifier[];  // buffs, debuffs, talents
}

const calculateDamage = (calc: DamageCalculation): number => { ... }
```

### 2. DoT Scheduler

```typescript
interface DoTConfig {
  duration: number;
  tickInterval: number;
  haste: number;
  pandemic: boolean;
}

const scheduleDoTTicks = (emitter: Emitter, config: DoTConfig): void => { ... }
```

### 3. Proc System

```typescript
interface RPPMConfig {
  baseRate: number;       // procs per minute
  hasteScaling: boolean;
  critScaling: boolean;
}

const rollRPPM = (rng: RNGService, config: RPPMConfig, haste: number): boolean => { ... }
```

### 4. Pet Manager (Hunter-specific but reusable pattern)

```typescript
interface PetConfig {
  ownerUnitId: UnitID;
  scalingFactors: { ap: number; stamina: number };
  abilities: SpellID[];
}

const createPet = (state: GameState, config: PetConfig): Unit => { ... }
```

### 5. Buff/Debuff Helpers

```typescript
const hasAura = (unit: Unit, spellId: SpellID): boolean => { ... }
const getAuraStacks = (unit: Unit, spellId: SpellID): number => { ... }
const getAuraRemaining = (unit: Unit, spellId: SpellID, currentTime: number): number => { ... }
```

---

## Recommendation

**Go with Option B** (single `wowlab-specs` package):

```
packages/wowlab-specs/
  src/
    index.ts                 # exports registerAllSpecs, all SpecDefinitions
    shared/
      events.ts              # createDamage, createAura, createSummon
      types.ts               # SpellHandler, SpecDefinition
      register.ts            # registerSpec, registerSpecs
    hunter/
      index.ts               # exports BeastMastery, Marksmanship, Survival
      constants.ts           # HunterSpells, HunterBuffs, HunterCosts
      beast-mastery.ts       # BeastMastery: SpecDefinition
      marksmanship.ts
      survival.ts
    mage/
      index.ts
      constants.ts
      arcane.ts
      fire.ts
      frost.ts
    # ... 11 more classes
```

**Why Option B over others:**

- Single package = one tsconfig, one build, one version
- Shared utilities (`shared/`) available to all specs
- Class folders keep related specs together (matches SimC)
- No "13 packages" boilerplate hell
- Easy to add new specs: copy template, fill in handlers

**Why not Option A (per-class packages):**
With the boilerplate reduction utilities above, there's no benefit to separate packages. The shared code lives in `shared/`, and each spec file is ~50 lines max.

**Consider Option D** (separate `wowlab-mechanics`) later when:

- Mechanics need to be reused outside simulation (tooltips, UI)
- Testing requires pure function isolation

---

## Handler Pattern Standard

Every spec handler file should follow this structure:

```typescript
// specs/hunter/beast-mastery.ts

import { CombatLog } from "@wowlab/core/Schemas";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as Effect from "effect/Effect";

// =============================================================================
// Spell IDs
// =============================================================================

const SpellIds = {
  KILL_COMMAND: 34026,
  // ...
} as const;

// =============================================================================
// Handlers
// =============================================================================

const onKillCommandCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Handler logic
  });

// =============================================================================
// Registration
// =============================================================================

export const registerBeastMasteryHandlers = Effect.gen(function* () {
  const combatLog = yield* CombatLogService.CombatLogService;

  yield* combatLog.on(
    { spellId: SpellIds.KILL_COMMAND, subevent: "SPELL_CAST_SUCCESS" },
    onKillCommandCast,
    { id: "bm:kill-command", priority: 10 },
  );

  // ... more registrations
});
```

---

## Open Questions

1. **Talents**: How do we handle talent variations? Conditional handlers? Multiple handler sets?
2. **Hero Talents**: Pack Leader vs Dark Ranger need different handler chains
3. **Tier Sets**: Seasonal bonuses that modify existing handlers
4. **Testing**: How do we test handlers in isolation?
5. **APL**: Where does the APL/rotation logic live relative to handlers?

---

## Next Steps

1. [ ] Restructure standalone handlers into `specs/` folder
2. [ ] Implement shared utilities (damage calc, proc system)
3. [ ] Add Marksmanship as second spec to validate patterns
4. [ ] Document handler testing approach
5. [ ] Extract to package when ready
