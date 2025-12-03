# Combat Log Event System

Plan for implementing an event-driven simulation that mirrors WoW's combat log (CLEU).

---

## Current State

| Component           | Location                             | Status                 |
| ------------------- | ------------------------------------ | ---------------------- |
| Combat log schemas  | `@wowlab/core/schemas/combat-log/`   | Partial, needs rework  |
| GameState           | `@wowlab/core/entities/GameState.ts` | Working                |
| StateService        | `@wowlab/services/State`             | Working                |
| SpellActions.cast() | `@wowlab/rotation/SpellActions.ts`   | Directly mutates state |

---

## WoW Combat Log Structure

Reference: [Wowpedia COMBAT_LOG_EVENT](https://warcraft.wiki.gg/wiki/COMBAT_LOG_EVENT)

### Base Parameters (11 fields, always present)

| #   | Field           | Type      | Description                                          |
| --- | --------------- | --------- | ---------------------------------------------------- |
| 1   | timestamp       | `number`  | Unix time with ms precision (e.g., `1555749627.861`) |
| 2   | subevent        | `string`  | Event type (e.g., `"SPELL_DAMAGE"`)                  |
| 3   | hideCaster      | `boolean` | Source is hidden                                     |
| 4   | sourceGUID      | `string`  | Source unit GUID                                     |
| 5   | sourceName      | `string`  | Source unit name                                     |
| 6   | sourceFlags     | `number`  | Unit type/controller/reaction flags                  |
| 7   | sourceRaidFlags | `number`  | Raid marker flags                                    |
| 8   | destGUID        | `string`  | Destination unit GUID                                |
| 9   | destName        | `string`  | Destination unit name                                |
| 10  | destFlags       | `number`  | Unit flags                                           |
| 11  | destRaidFlags   | `number`  | Raid marker flags                                    |

### Event Composition: PREFIX + SUFFIX

Events are composed of a **prefix** (source info) and **suffix** (effect type).

#### Prefixes

| Prefix           | Params 12-14                    |
| ---------------- | ------------------------------- |
| `SWING`          | (none)                          |
| `RANGE`          | spellId, spellName, spellSchool |
| `SPELL`          | spellId, spellName, spellSchool |
| `SPELL_PERIODIC` | spellId, spellName, spellSchool |
| `SPELL_BUILDING` | spellId, spellName, spellSchool |
| `ENVIRONMENTAL`  | environmentalType               |

#### Suffixes

| Suffix               | Additional Params                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `_CAST_START`        | (none)                                                                                         |
| `_CAST_SUCCESS`      | (none)                                                                                         |
| `_CAST_FAILED`       | failedType                                                                                     |
| `_DAMAGE`            | amount, overkill, school, resisted, blocked, absorbed, critical, glancing, crushing, isOffHand |
| `_MISSED`            | missType, isOffHand, amountMissed, critical                                                    |
| `_HEAL`              | amount, overhealing, absorbed, critical                                                        |
| `_ENERGIZE`          | amount, overEnergize, powerType                                                                |
| `_DRAIN`             | amount, powerType, extraAmount                                                                 |
| `_AURA_APPLIED`      | auraType, amount                                                                               |
| `_AURA_REMOVED`      | auraType, amount                                                                               |
| `_AURA_APPLIED_DOSE` | auraType, amount                                                                               |
| `_AURA_REMOVED_DOSE` | auraType, amount                                                                               |
| `_AURA_REFRESH`      | auraType                                                                                       |
| `_INTERRUPT`         | extraSpellId, extraSpellName, extraSchool                                                      |
| `_SUMMON`            | (none)                                                                                         |
| `_INSTAKILL`         | unconsciousOnDeath                                                                             |

#### Special Events

| Event        | Params                      |
| ------------ | --------------------------- |
| `UNIT_DIED`  | recapID, unconsciousOnDeath |
| `PARTY_KILL` | (none)                      |

---

## Implementation Plan

### Phase 1: Combat Log Schemas (Effect/Schema)

Location: `packages/wowlab-core/src/internal/schemas/combat-log/`

#### 1.1 Branded Types for Flags

```typescript
// Branded.ts
import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";

// Branded number types to prevent mixing
export type UnitFlags = number & Brand.Brand<"UnitFlags">;
export const UnitFlags = Brand.nominal<UnitFlags>();

export type RaidFlags = number & Brand.Brand<"RaidFlags">;
export const RaidFlags = Brand.nominal<RaidFlags>();

export type SpellSchool = number & Brand.Brand<"SpellSchool">;
export const SpellSchool = Brand.nominal<SpellSchool>();

// Schema versions
export const UnitFlagsSchema = Schema.Number.pipe(Schema.brand("UnitFlags"));
export const RaidFlagsSchema = Schema.Number.pipe(Schema.brand("RaidFlags"));
export const SpellSchoolSchema = Schema.Number.pipe(
  Schema.brand("SpellSchool"),
);
```

#### 1.2 Enums

```typescript
// Enums.ts
import * as Schema from "effect/Schema";

export const SpellSchoolEnum = {
  Physical: 1,
  Holy: 2,
  Fire: 4,
  Nature: 8,
  Frost: 16,
  Shadow: 32,
  Arcane: 64,
} as const;

export const PowerTypeEnum = {
  Mana: 0,
  Rage: 1,
  Focus: 2,
  Energy: 3,
  ComboPoints: 4,
  Runes: 5,
  RunicPower: 6,
  SoulShards: 7,
  LunarPower: 8,
  HolyPower: 9,
  Maelstrom: 11,
  Chi: 12,
  Insanity: 13,
  ArcaneCharges: 16,
  Fury: 17,
  Pain: 18,
  Essence: 19,
} as const;

export const AuraType = Schema.Literal("BUFF", "DEBUFF");
export type AuraType = Schema.Schema.Type<typeof AuraType>;

export const MissType = Schema.Literal(
  "ABSORB",
  "BLOCK",
  "DEFLECT",
  "DODGE",
  "EVADE",
  "IMMUNE",
  "MISS",
  "PARRY",
  "REFLECT",
  "RESIST",
);
export type MissType = Schema.Schema.Type<typeof MissType>;
```

#### 1.3 Base Schema with extend()

```typescript
// Base.ts
import * as Schema from "effect/Schema";

export class CombatLogEventBase extends Schema.Class<CombatLogEventBase>(
  "CombatLogEventBase",
)({
  timestamp: Schema.Number,
  hideCaster: Schema.Boolean,
  sourceGUID: Schema.String,
  sourceName: Schema.String,
  sourceFlags: Schema.Number,
  sourceRaidFlags: Schema.Number,
  destGUID: Schema.String,
  destName: Schema.String,
  destFlags: Schema.Number,
  destRaidFlags: Schema.Number,
}) {}
```

#### 1.4 Prefix Classes

```typescript
// Prefix.ts
import * as Schema from "effect/Schema";

export class SpellPrefix extends Schema.Class<SpellPrefix>("SpellPrefix")({
  spellId: Schema.Number,
  spellName: Schema.String,
  spellSchool: Schema.Number,
}) {}

export class EnvironmentalPrefix extends Schema.Class<EnvironmentalPrefix>(
  "EnvironmentalPrefix",
)({
  environmentalType: Schema.String,
}) {}
```

#### 1.5 Suffix Classes

```typescript
// Suffix.ts
import * as Schema from "effect/Schema";

export class DamageSuffix extends Schema.Class<DamageSuffix>("DamageSuffix")({
  amount: Schema.Number,
  overkill: Schema.Number,
  school: Schema.Number,
  resisted: Schema.NullOr(Schema.Number),
  blocked: Schema.NullOr(Schema.Number),
  absorbed: Schema.NullOr(Schema.Number),
  critical: Schema.Boolean,
  glancing: Schema.Boolean,
  crushing: Schema.Boolean,
  isOffHand: Schema.Boolean,
}) {}

export class HealSuffix extends Schema.Class<HealSuffix>("HealSuffix")({
  amount: Schema.Number,
  overhealing: Schema.Number,
  absorbed: Schema.Number,
  critical: Schema.Boolean,
}) {}

export class EnergizeSuffix extends Schema.Class<EnergizeSuffix>(
  "EnergizeSuffix",
)({
  amount: Schema.Number,
  overEnergize: Schema.Number,
  powerType: Schema.Number,
}) {}

export class AuraSuffix extends Schema.Class<AuraSuffix>("AuraSuffix")({
  auraType: AuraType,
  amount: Schema.NullOr(Schema.Number),
}) {}

export class MissedSuffix extends Schema.Class<MissedSuffix>("MissedSuffix")({
  missType: MissType,
  isOffHand: Schema.Boolean,
  amountMissed: Schema.NullOr(Schema.Number),
  critical: Schema.Boolean,
}) {}
```

#### 1.6 Complete Events with TaggedUnion

```typescript
// Events.ts
import * as Schema from "effect/Schema";

// Spell events (Base + SpellPrefix + optional suffix)
export class SpellCastStart extends Schema.TaggedClass<SpellCastStart>()(
  "SPELL_CAST_START",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

export class SpellCastSuccess extends Schema.TaggedClass<SpellCastSuccess>()(
  "SPELL_CAST_SUCCESS",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

export class SpellDamage extends Schema.TaggedClass<SpellDamage>()(
  "SPELL_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

export class SpellPeriodicDamage extends Schema.TaggedClass<SpellPeriodicDamage>()(
  "SPELL_PERIODIC_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

export class SpellHeal extends Schema.TaggedClass<SpellHeal>()("SPELL_HEAL", {
  ...CombatLogEventBase.fields,
  ...SpellPrefix.fields,
  ...HealSuffix.fields,
}) {}

export class SpellEnergize extends Schema.TaggedClass<SpellEnergize>()(
  "SPELL_ENERGIZE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...EnergizeSuffix.fields,
  },
) {}

export class SpellAuraApplied extends Schema.TaggedClass<SpellAuraApplied>()(
  "SPELL_AURA_APPLIED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

export class SpellAuraRemoved extends Schema.TaggedClass<SpellAuraRemoved>()(
  "SPELL_AURA_REMOVED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

export class SpellAuraRefresh extends Schema.TaggedClass<SpellAuraRefresh>()(
  "SPELL_AURA_REFRESH",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    auraType: AuraType,
  },
) {}

export class SpellAuraAppliedDose extends Schema.TaggedClass<SpellAuraAppliedDose>()(
  "SPELL_AURA_APPLIED_DOSE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

export class SpellSummon extends Schema.TaggedClass<SpellSummon>()(
  "SPELL_SUMMON",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

export class SpellMissed extends Schema.TaggedClass<SpellMissed>()(
  "SPELL_MISSED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...MissedSuffix.fields,
  },
) {}

// Swing events (Base + DamageSuffix, no spell prefix)
export class SwingDamage extends Schema.TaggedClass<SwingDamage>()(
  "SWING_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...DamageSuffix.fields,
  },
) {}

export class SwingMissed extends Schema.TaggedClass<SwingMissed>()(
  "SWING_MISSED",
  {
    ...CombatLogEventBase.fields,
    ...MissedSuffix.fields,
  },
) {}

// Special events
export class UnitDied extends Schema.TaggedClass<UnitDied>()("UNIT_DIED", {
  ...CombatLogEventBase.fields,
  recapID: Schema.NullOr(Schema.Number),
  unconsciousOnDeath: Schema.NullOr(Schema.Boolean),
}) {}
```

#### 1.7 Union Type with Type Guards

```typescript
// CombatLogEvent.ts
import * as Schema from "effect/Schema";

export const CombatLogEvent = Schema.Union(
  SpellCastStart,
  SpellCastSuccess,
  SpellDamage,
  SpellPeriodicDamage,
  SpellHeal,
  SpellEnergize,
  SpellAuraApplied,
  SpellAuraRemoved,
  SpellAuraRefresh,
  SpellAuraAppliedDose,
  SpellSummon,
  SpellMissed,
  SwingDamage,
  SwingMissed,
  UnitDied,
);

export type CombatLogEvent = Schema.Schema.Type<typeof CombatLogEvent>;

// Type guard helpers
export type SpellEvent = Extract<CombatLogEvent, { spellId: number }>;
export type DamageEvent = Extract<
  CombatLogEvent,
  { amount: number; overkill: number }
>;
export type AuraEvent = Extract<CombatLogEvent, { auraType: AuraType }>;

export const isSpellEvent = (event: CombatLogEvent): event is SpellEvent =>
  "spellId" in event;

export const isDamageEvent = (event: CombatLogEvent): event is DamageEvent =>
  "amount" in event && "overkill" in event;

export const isAuraEvent = (event: CombatLogEvent): event is AuraEvent =>
  "auraType" in event;

// Subevent literal type
export type Subevent = CombatLogEvent["_tag"];
```

---

### Phase 2: Errors (Data.TaggedError)

```typescript
// packages/wowlab-core/src/internal/errors/CombatLogErrors.ts
import * as Data from "effect/Data";

export class QueueEmpty extends Data.TaggedError("QueueEmpty")<{
  readonly message: string;
}> {}

export class HandlerError extends Data.TaggedError("HandlerError")<{
  readonly handlerId: string;
  readonly event: CombatLogEvent;
  readonly cause: unknown;
}> {}

export class EventValidationError extends Data.TaggedError(
  "EventValidationError",
)<{
  readonly event: unknown;
  readonly message: string;
}> {}

export type CombatLogError = QueueEmpty | HandlerError | EventValidationError;
```

---

### Phase 3: Event Infrastructure (Effect Queue + PubSub)

#### 3.1 EventQueue Layer (Effect.Queue)

```typescript
// packages/wowlab-services/src/internal/event-queue/EventQueue.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as Context from "effect/Context";
import type { CombatLogEvent } from "@wowlab/core/Schemas";

// Tag for the queue
export class EventQueue extends Context.Tag("EventQueue")<
  EventQueue,
  Queue.Queue<CombatLogEvent>
>() {}

// Layer that creates an unbounded queue
export const EventQueueLive = Layer.scoped(
  EventQueue,
  Queue.unbounded<CombatLogEvent>(),
);

// Helper functions
export const offer = (event: CombatLogEvent) =>
  Effect.flatMap(EventQueue, (queue) => Queue.offer(queue, event));

export const offerAll = (events: readonly CombatLogEvent[]) =>
  Effect.flatMap(EventQueue, (queue) => Queue.offerAll(queue, events));

export const take = Effect.flatMap(EventQueue, Queue.take);

export const takeAll = Effect.flatMap(EventQueue, Queue.takeAll);

export const poll = Effect.flatMap(EventQueue, Queue.poll);

export const size = Effect.flatMap(EventQueue, Queue.size);

export const isEmpty = Effect.flatMap(EventQueue, (queue) =>
  Effect.map(Queue.size(queue), (s) => s === 0),
);
```

#### 3.2 Emitter Context (for handlers)

```typescript
// packages/wowlab-services/src/internal/combat-log/Emitter.ts
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Ref from "effect/Ref";
import type { CombatLogEvent } from "@wowlab/core/Schemas";

export interface Emitter {
  // Emit event at current timestamp
  readonly emit: (event: CombatLogEvent) => void;

  // Emit event at offset from current timestamp
  readonly emitAt: (
    offsetMs: number,
    event: Omit<CombatLogEvent, "timestamp">,
  ) => void;

  // Emit multiple events
  readonly emitBatch: (events: readonly CombatLogEvent[]) => void;

  // Get current simulation time
  readonly currentTime: number;

  // Get all emitted events (for batching after handler completes)
  readonly getEmitted: () => readonly CombatLogEvent[];
}

export class EmitterContext extends Context.Tag("EmitterContext")<
  EmitterContext,
  Emitter
>() {}

// Create emitter for a handler invocation
export const makeEmitter = (currentTime: number) =>
  Effect.gen(function* () {
    const emittedRef = yield* Ref.make<CombatLogEvent[]>([]);

    const emitter: Emitter = {
      currentTime,

      emit: (event) => {
        Ref.update(emittedRef, (arr) => [...arr, event]);
      },

      emitAt: (offsetMs, event) => {
        const fullEvent = {
          ...event,
          timestamp: currentTime + offsetMs / 1000,
        } as CombatLogEvent;
        Ref.update(emittedRef, (arr) => [...arr, fullEvent]);
      },

      emitBatch: (events) => {
        Ref.update(emittedRef, (arr) => [...arr, ...events]);
      },

      getEmitted: () => {
        // This is synchronous access for the callback pattern
        let result: CombatLogEvent[] = [];
        Effect.runSync(
          Ref.get(emittedRef).pipe(
            Effect.map((r) => {
              result = r;
            }),
          ),
        );
        return result;
      },
    };

    return emitter;
  });
```

#### 3.3 Handler Registry

```typescript
// packages/wowlab-services/src/internal/combat-log/HandlerRegistry.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import * as Ref from "effect/Ref";
import * as Option from "effect/Option";
import { Map } from "immutable";
import type {
  CombatLogEvent,
  Subevent,
  SpellEvent,
} from "@wowlab/core/Schemas";
import type { Emitter } from "./Emitter.js";

// Handler type - generic over the event type it handles
export type EventHandler<
  E extends CombatLogEvent = CombatLogEvent,
  R = never,
  Err = never,
> = (event: E, emitter: Emitter) => Effect.Effect<void, Err, R>;

// Handler entry with metadata
export interface HandlerEntry {
  readonly id: string;
  readonly handler: EventHandler<any, any, any>;
  readonly priority: number; // Lower = runs first
}

// Filter for matching events
export interface EventFilter {
  readonly subevent: Subevent;
  readonly spellId?: number;
}

// Subscription handle for cleanup
export interface Subscription {
  readonly id: string;
  readonly unsubscribe: Effect.Effect<void>;
}

// Registry service interface
export interface HandlerRegistry {
  // Subscribe to events matching filter
  readonly on: <E extends CombatLogEvent, R, Err>(
    filter: EventFilter,
    handler: EventHandler<E, R, Err>,
    options?: { priority?: number; id?: string },
  ) => Effect.Effect<Subscription>;

  // Convenience: subscribe to specific spell
  readonly onSpell: <R, Err>(
    subevent: Subevent,
    spellId: number,
    handler: EventHandler<SpellEvent, R, Err>,
    options?: { priority?: number; id?: string },
  ) => Effect.Effect<Subscription>;

  // Get all handlers matching an event
  readonly getHandlers: (
    event: CombatLogEvent,
  ) => Effect.Effect<readonly HandlerEntry[]>;

  // Unsubscribe by id
  readonly unsubscribe: (id: string) => Effect.Effect<void>;
}

export class HandlerRegistryTag extends Context.Tag("HandlerRegistry")<
  HandlerRegistryTag,
  HandlerRegistry
>() {}

// Implementation
export const HandlerRegistryLive = Layer.effect(
  HandlerRegistryTag,
  Effect.gen(function* () {
    // Map<filterKey, HandlerEntry[]>
    const handlersRef = yield* Ref.make<Map<string, HandlerEntry[]>>(Map());
    let nextId = 0;

    const makeKey = (filter: EventFilter) =>
      filter.spellId !== undefined
        ? `${filter.subevent}:${filter.spellId}`
        : filter.subevent;

    const registry: HandlerRegistry = {
      on: (filter, handler, options = {}) =>
        Effect.gen(function* () {
          const id = options.id ?? `handler-${nextId++}`;
          const priority = options.priority ?? 100;
          const key = makeKey(filter);

          yield* Ref.update(handlersRef, (m) => {
            const existing = m.get(key) ?? [];
            const updated = [...existing, { id, handler, priority }].sort(
              (a, b) => a.priority - b.priority,
            );
            return m.set(key, updated);
          });

          return {
            id,
            unsubscribe: registry.unsubscribe(id),
          };
        }),

      onSpell: (subevent, spellId, handler, options) =>
        registry.on({ subevent, spellId }, handler, options),

      getHandlers: (event) =>
        Effect.gen(function* () {
          const m = yield* Ref.get(handlersRef);

          // Get spell-specific handlers if applicable
          const spellId =
            "spellId" in event ? (event as SpellEvent).spellId : undefined;
          const specificKey =
            spellId !== undefined ? `${event._tag}:${spellId}` : undefined;
          const specific = specificKey ? (m.get(specificKey) ?? []) : [];

          // Get general handlers for this subevent
          const general = m.get(event._tag) ?? [];

          // Spell-specific first, then general, both sorted by priority
          return [...specific, ...general];
        }),

      unsubscribe: (id) =>
        Ref.update(handlersRef, (m) =>
          m.map((entries) => entries.filter((e) => e.id !== id)),
        ),
    };

    return registry;
  }),
);
```

#### 3.4 CombatLog Service (combines queue + registry)

```typescript
// packages/wowlab-services/src/internal/combat-log/CombatLogService.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import type {
  CombatLogEvent,
  Subevent,
  SpellEvent,
} from "@wowlab/core/Schemas";
import * as EventQueue from "../event-queue/EventQueue.js";
import {
  HandlerRegistryTag,
  HandlerRegistryLive,
  type EventHandler,
  type Subscription,
  type EventFilter,
} from "./HandlerRegistry.js";

export interface CombatLogService {
  // Emit event to queue
  readonly emit: (event: CombatLogEvent) => Effect.Effect<void>;

  // Emit multiple events
  readonly emitBatch: (
    events: readonly CombatLogEvent[],
  ) => Effect.Effect<void>;

  // Subscribe to events
  readonly on: <E extends CombatLogEvent, R, Err>(
    filter: EventFilter,
    handler: EventHandler<E, R, Err>,
    options?: { priority?: number; id?: string },
  ) => Effect.Effect<Subscription>;

  // Subscribe to specific spell
  readonly onSpell: <R, Err>(
    subevent: Subevent,
    spellId: number,
    handler: EventHandler<SpellEvent, R, Err>,
    options?: { priority?: number; id?: string },
  ) => Effect.Effect<Subscription>;

  // Unsubscribe
  readonly unsubscribe: (id: string) => Effect.Effect<void>;
}

export class CombatLogServiceTag extends Context.Tag("CombatLogService")<
  CombatLogServiceTag,
  CombatLogService
>() {}

export const CombatLogServiceLive = Layer.effect(
  CombatLogServiceTag,
  Effect.gen(function* () {
    const registry = yield* HandlerRegistryTag;

    const service: CombatLogService = {
      emit: EventQueue.offer,
      emitBatch: EventQueue.offerAll,
      on: registry.on,
      onSpell: registry.onSpell,
      unsubscribe: registry.unsubscribe,
    };

    return service;
  }),
).pipe(
  Layer.provide(HandlerRegistryLive),
  Layer.provide(EventQueue.EventQueueLive),
);
```

---

### Phase 4: Simulation Driver (Effect Stream)

```typescript
// packages/wowlab-services/src/internal/sim-driver/SimDriverService.ts
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import * as Queue from "effect/Queue";
import * as Option from "effect/Option";
import * as Fiber from "effect/Fiber";
import type { CombatLogEvent } from "@wowlab/core/Schemas";
import * as EventQueue from "../event-queue/EventQueue.js";
import { HandlerRegistryTag } from "../combat-log/HandlerRegistry.js";
import { makeEmitter } from "../combat-log/Emitter.js";
import { StateService } from "../state/StateService.js";
import { HandlerError } from "@wowlab/core/Errors";

export interface SimDriver {
  // Run simulation until endTime
  readonly run: (endTime: number) => Effect.Effect<void, HandlerError>;

  // Process single event (for debugging/stepping)
  readonly step: () => Effect.Effect<
    Option.Option<CombatLogEvent>,
    HandlerError
  >;

  // Run as Stream (for advanced composition)
  readonly asStream: (
    endTime: number,
  ) => Stream.Stream<CombatLogEvent, HandlerError>;
}

export class SimDriverTag extends Context.Tag("SimDriver")<
  SimDriverTag,
  SimDriver
>() {}

export const SimDriverLive = Layer.effect(
  SimDriverTag,
  Effect.gen(function* () {
    const queue = yield* EventQueue.EventQueue;
    const registry = yield* HandlerRegistryTag;
    const state = yield* StateService;

    // Process a single event
    const processEvent = (event: CombatLogEvent) =>
      Effect.gen(function* () {
        // Update simulation time
        yield* state.updateState((s) => s.set("currentTime", event.timestamp));

        // Create emitter for this event
        const emitter = yield* makeEmitter(event.timestamp);

        // Get and run handlers
        const handlers = yield* registry.getHandlers(event);

        for (const entry of handlers) {
          yield* Effect.catchAll(entry.handler(event, emitter), (cause) =>
            Effect.fail(
              new HandlerError({
                handlerId: entry.id,
                event,
                cause,
              }),
            ),
          ).pipe(
            Effect.withSpan(`handler:${entry.id}`),
            Effect.annotateLogs("handler", entry.id),
            Effect.annotateLogs("subevent", event._tag),
          );
        }

        // Queue emitted events
        const emitted = emitter.getEmitted();
        if (emitted.length > 0) {
          // Sort by timestamp before queueing
          const sorted = [...emitted].sort((a, b) => a.timestamp - b.timestamp);
          yield* Queue.offerAll(queue, sorted);
        }

        // Apply generic state mutations
        yield* applyEventToState(event);

        // Log event
        yield* Effect.logDebug(`Processed: ${event._tag}`);

        return event;
      });

    const driver: SimDriver = {
      run: (endTime) =>
        Effect.gen(function* () {
          while (true) {
            const maybeEvent = yield* Queue.poll(queue);

            if (Option.isNone(maybeEvent)) break;

            const event = maybeEvent.value;
            if (event.timestamp > endTime) {
              // Put it back and stop
              yield* Queue.offer(queue, event);
              break;
            }

            yield* processEvent(event);
          }
        }),

      step: () =>
        Effect.gen(function* () {
          const maybeEvent = yield* Queue.poll(queue);

          if (Option.isNone(maybeEvent)) {
            return Option.none();
          }

          const event = maybeEvent.value;
          yield* processEvent(event);
          return Option.some(event);
        }),

      asStream: (endTime) =>
        Stream.repeatEffectOption(
          Effect.gen(function* () {
            const maybeEvent = yield* Queue.poll(queue);

            if (Option.isNone(maybeEvent)) {
              return yield* Effect.fail(Option.none());
            }

            const event = maybeEvent.value;
            if (event.timestamp > endTime) {
              yield* Queue.offer(queue, event);
              return yield* Effect.fail(Option.none());
            }

            yield* processEvent(event);
            return event;
          }),
        ),
    };

    return driver;
  }),
);

// Generic state mutations based on event type
const applyEventToState = (event: CombatLogEvent) =>
  Effect.gen(function* () {
    const state = yield* StateService;

    switch (event._tag) {
      case "SPELL_AURA_APPLIED":
        yield* Effect.logDebug(
          `Aura applied: ${event.spellName} on ${event.destName}`,
        );
        // TODO: Add aura to destGUID unit
        break;

      case "SPELL_AURA_REMOVED":
        yield* Effect.logDebug(
          `Aura removed: ${event.spellName} from ${event.destName}`,
        );
        // TODO: Remove aura from destGUID unit
        break;

      case "SPELL_AURA_APPLIED_DOSE":
        yield* Effect.logDebug(
          `Aura stack: ${event.spellName} (${event.amount}) on ${event.destName}`,
        );
        // TODO: Update aura stacks
        break;

      case "SPELL_AURA_REFRESH":
        yield* Effect.logDebug(
          `Aura refresh: ${event.spellName} on ${event.destName}`,
        );
        // TODO: Refresh aura duration
        break;

      case "SPELL_ENERGIZE":
        yield* Effect.logDebug(
          `Energize: ${event.destName} +${event.amount} power`,
        );
        // TODO: Add power to destGUID unit
        break;

      case "SPELL_DAMAGE":
      case "SPELL_PERIODIC_DAMAGE":
        yield* Effect.logDebug(
          `Damage: ${event.spellName} hit ${event.destName} for ${event.amount}`,
        );
        // TODO: Reduce health on destGUID unit
        break;

      case "SWING_DAMAGE":
        yield* Effect.logDebug(
          `Swing: ${event.sourceName} hit ${event.destName} for ${event.amount}`,
        );
        // TODO: Reduce health on destGUID unit
        break;

      case "UNIT_DIED":
        yield* Effect.logDebug(`Unit died: ${event.destName}`);
        // TODO: Mark unit as dead
        break;

      case "SPELL_SUMMON":
        yield* Effect.logDebug(
          `Summon: ${event.sourceName} summoned ${event.destName}`,
        );
        // TODO: Create new unit
        break;
    }
  });
```

---

### Phase 5: Spec Handler Structure

```
packages/wowlab-specs/
├── shared/
│   ├── types.ts              # Re-export EventHandler, Emitter types
│   └── helpers.ts            # Common emit helpers
│
└── hunter/
    └── beast-mastery/
        ├── index.ts          # registerBMHandlers()
        ├── constants.ts      # Spell IDs
        │
        ├── spells/
        │   ├── kill-command.ts
        │   ├── barbed-shot.ts
        │   ├── cobra-shot.ts
        │   ├── bestial-wrath.ts
        │   └── multi-shot.ts
        │
        └── auras/
            ├── frenzy.ts
            ├── beast-cleave.ts
            └── bestial-wrath.ts
```

#### Handler Example (fully typed)

```typescript
// packages/wowlab-specs/hunter/beast-mastery/spells/kill-command.ts
import * as Effect from "effect/Effect";
import type { EventHandler } from "@wowlab/services/CombatLog";
import type { SpellCastSuccess } from "@wowlab/core/Schemas";
import { RNGService } from "@wowlab/services/Rng";
import { KILL_COMMAND, PET_KILL_COMMAND, DIRE_BEAST } from "../constants.js";

// Handler is typed to receive SpellCastSuccess events
export const onKillCommandCast: EventHandler<SpellCastSuccess, RNGService> = (
  event,
  emitter,
) =>
  Effect.gen(function* () {
    const rng = yield* RNGService;

    // Pet performs Kill Command
    emitter.emit({
      _tag: "SPELL_CAST_SUCCESS",
      timestamp: event.timestamp,
      hideCaster: false,
      sourceGUID: "pet-guid", // TODO: get actual pet from state
      sourceName: "Pet",
      sourceFlags: 0,
      sourceRaidFlags: 0,
      destGUID: event.destGUID,
      destName: event.destName,
      destFlags: event.destFlags,
      destRaidFlags: event.destRaidFlags,
      spellId: PET_KILL_COMMAND,
      spellName: "Kill Command",
      spellSchool: 1,
    });

    // Dire Command proc (15% chance)
    const roll = yield* rng.next();
    if (roll < 0.15) {
      emitter.emit({
        _tag: "SPELL_SUMMON",
        timestamp: event.timestamp,
        hideCaster: false,
        sourceGUID: event.sourceGUID,
        sourceName: event.sourceName,
        sourceFlags: event.sourceFlags,
        sourceRaidFlags: event.sourceRaidFlags,
        destGUID: `dire-beast-${Date.now()}`,
        destName: "Dire Beast",
        destFlags: 0,
        destRaidFlags: 0,
        spellId: DIRE_BEAST,
        spellName: "Dire Beast",
        spellSchool: 1,
      });

      yield* Effect.logInfo("Dire Command proc!");
    }
  });
```

#### Spec Registration

```typescript
// packages/wowlab-specs/hunter/beast-mastery/index.ts
import * as Effect from "effect/Effect";
import { CombatLogServiceTag } from "@wowlab/services/CombatLog";
import { KILL_COMMAND, BARBED_SHOT, FRENZY_BUFF } from "./constants.js";
import { onKillCommandCast } from "./spells/kill-command.js";
import { onBarbedShotCast } from "./spells/barbed-shot.js";
import { onFrenzyApplied, onFrenzyDose } from "./auras/frenzy.js";

export const registerBMHandlers = Effect.gen(function* () {
  const combatLog = yield* CombatLogServiceTag;

  // Spell cast handlers
  yield* combatLog.onSpell(
    "SPELL_CAST_SUCCESS",
    KILL_COMMAND,
    onKillCommandCast,
    {
      id: "bm:kill-command",
      priority: 10,
    },
  );

  yield* combatLog.onSpell(
    "SPELL_CAST_SUCCESS",
    BARBED_SHOT,
    onBarbedShotCast,
    {
      id: "bm:barbed-shot",
      priority: 10,
    },
  );

  // Aura handlers
  yield* combatLog.onSpell("SPELL_AURA_APPLIED", FRENZY_BUFF, onFrenzyApplied, {
    id: "bm:frenzy-applied",
  });

  yield* combatLog.onSpell(
    "SPELL_AURA_APPLIED_DOSE",
    FRENZY_BUFF,
    onFrenzyDose,
    {
      id: "bm:frenzy-dose",
    },
  );

  yield* Effect.logInfo("Beast Mastery handlers registered");
});
```

---

### Phase 6: Layer Composition

```typescript
// packages/wowlab-runtime/src/SimulationLayer.ts
import * as Layer from "effect/Layer";
import { EventQueueLive } from "@wowlab/services/EventQueue";
import { HandlerRegistryLive } from "@wowlab/services/HandlerRegistry";
import { CombatLogServiceLive } from "@wowlab/services/CombatLog";
import { SimDriverLive } from "@wowlab/services/SimDriver";
import { StateService } from "@wowlab/services/State";
import { RNGServiceDefault } from "@wowlab/services/Rng";
import { ConsoleLogger } from "@wowlab/services/Log";

// Base simulation layer
export const SimulationLive = Layer.mergeAll(
  EventQueueLive,
  HandlerRegistryLive,
  StateService.Default,
  RNGServiceDefault,
  ConsoleLogger,
).pipe(
  Layer.provideMerge(CombatLogServiceLive),
  Layer.provideMerge(SimDriverLive),
);

// Test layer with seeded RNG
export const SimulationTest = (seed: number) =>
  Layer.mergeAll(
    EventQueueLive,
    HandlerRegistryLive,
    StateService.Default,
    RNGServiceSeeded(seed),
    TestLogger,
  ).pipe(
    Layer.provideMerge(CombatLogServiceLive),
    Layer.provideMerge(SimDriverLive),
  );
```

---

## Implementation Order

| #   | Task                             | Location                              | Depends On |
| --- | -------------------------------- | ------------------------------------- | ---------- |
| 1   | Branded types + enums            | `@wowlab/core/schemas/`               | -          |
| 2   | Combat log schemas (TaggedClass) | `@wowlab/core/schemas/combat-log/`    | 1          |
| 3   | Error types                      | `@wowlab/core/errors/`                | -          |
| 4   | EventQueue layer                 | `@wowlab/services/event-queue/`       | 2          |
| 5   | Emitter helper                   | `@wowlab/services/combat-log/`        | 2          |
| 6   | HandlerRegistry                  | `@wowlab/services/combat-log/`        | 4, 5       |
| 7   | CombatLogService                 | `@wowlab/services/combat-log/`        | 6          |
| 8   | SimDriver                        | `@wowlab/services/sim-driver/`        | 7          |
| 9   | Generic state mutations          | `@wowlab/services/sim-driver/`        | 8          |
| 10  | Refactor SpellActions            | `@wowlab/rotation/`                   | 7          |
| 11  | Create specs package             | `packages/wowlab-specs/`              | -          |
| 12  | BM handlers                      | `@wowlab/specs/hunter/beast-mastery/` | 7, 11      |
| 13  | Layer composition                | `@wowlab/runtime/`                    | 8          |

---

## Design Decisions

### Implemented

1. **Effect.Queue** instead of manual array sorting
2. **TaggedClass** for discriminated unions with `_tag`
3. **Type-safe handlers** generic over event type
4. **Emitter object** with helpers (`emit`, `emitAt`, `emitBatch`)
5. **Subscription handles** for cleanup
6. **Priority system** for handler ordering
7. **Branded types** for flags to prevent mixing
8. **Layers** for dependency injection and testing
9. **Stream API** for advanced composition
10. **Logging** via Effect.logDebug/logInfo

### Future Considerations

1. **Schedule** for DoT ticks and periodic effects
2. **STM (TRef)** if concurrent fiber access needed
3. **Supervisor** for fiber debugging
4. **Combat log history** storage for replay/debugging

---

## Example: Full Event Flow

```
1. Rotation calls: combatLog.emit(SpellCastSuccess({ spellId: 34026, ... }))

2. SimDriver.run(300) starts processing

3. Driver dequeues: SPELL_CAST_SUCCESS { spellId: 34026, source: player }

4. Registry finds handlers: [{ id: "bm:kill-command", handler: onKillCommandCast }]

5. Driver creates Emitter, calls handler

6. Handler emits via emitter:
   - SPELL_CAST_SUCCESS { spellId: 83381, source: pet }
   - SPELL_SUMMON { spellId: DIRE_BEAST } (if proc)

7. Driver queues emitted events (sorted by timestamp)

8. Driver applies state mutation (logs for now)

9. Driver dequeues next: SPELL_CAST_SUCCESS { spellId: 83381, source: pet }

10. Pet KC handler emits SPELL_DAMAGE

11. Continue until queue empty or endTime reached
```
