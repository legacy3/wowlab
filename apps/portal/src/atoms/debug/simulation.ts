import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";
import * as Fiber from "effect/Fiber";
import * as PubSub from "effect/PubSub";
import * as Queue from "effect/Queue";
import { Map } from "immutable";
import { createSupabaseAppLayer } from "@/lib/supabase-app-layer";
import { supabaseClientAtom } from "@/atoms/supabase";
import * as Entities from "@packages/innocent-domain/Entities";
import * as Events from "@packages/innocent-domain/Events";
import * as DomainState from "@packages/innocent-domain/State";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Data from "@packages/innocent-services/Data";
import * as Simulation from "@packages/innocent-services/Simulation";
import * as State from "@packages/innocent-services/State";
import * as Unit from "@packages/innocent-services/Unit";
import * as RotationContext from "@packages/innocent-rotation/Context";

const createPlayerUnit = (): Entities.Unit => ({
  id: Branded.UnitID("player"),
  name: "Player",
  isPlayer: true,
  health: Entities.Power.create({ current: 25000, max: 25000 }),
  paperDoll: Entities.PaperDoll.create({
    class: "Mage",
    level: 80,
    armor: 0,
    avoidance: 0,
    critRating: 0,
    hasteRating: 0,
    mainStat: 0,
    masteryPercent: 0,
    stamina: 0,
    versatilityRating: 0,
  }),
  position: { x: 0, y: 0, z: 0 },
  power: Map<Entities.Types.PowerKey, Entities.Power>([
    ["mana", Entities.Power.create({ current: 15000, max: 15000 })],
    ["rage", Entities.Power.create({ current: 0, max: 100 })],
    ["focus", Entities.Power.create({ current: 100, max: 100 })],
    ["energy", Entities.Power.create({ current: 100, max: 100 })],
    ["comboPoints", Entities.Power.create({ current: 0, max: 5 })],
    ["runes", Entities.Power.create({ current: 6, max: 6 })],
    ["runicPower", Entities.Power.create({ current: 0, max: 100 })],
    ["soulShards", Entities.Power.create({ current: 3, max: 5 })],
    ["lunarPower", Entities.Power.create({ current: 0, max: 100 })],
    ["holyPower", Entities.Power.create({ current: 0, max: 5 })],
    ["alternativePower", Entities.Power.create({ current: 0, max: 100 })],
    ["maelstrom", Entities.Power.create({ current: 0, max: 100 })],
    ["chi", Entities.Power.create({ current: 0, max: 6 })],
    ["insanity", Entities.Power.create({ current: 0, max: 100 })],
    ["burningEmbers", Entities.Power.create({ current: 0, max: 0 })],
    ["demonicFury", Entities.Power.create({ current: 0, max: 0 })],
    ["arcaneCharges", Entities.Power.create({ current: 0, max: 4 })],
    ["fury", Entities.Power.create({ current: 0, max: 100 })],
    ["pain", Entities.Power.create({ current: 0, max: 100 })],
  ]),
  profiles: ["player-base", "class-mage", "spec-mage-fire"],
  auras: { all: Map<Branded.SpellID, Entities.Aura>(), meta: {} },
  spells: {
    all: Map<Branded.SpellID, Entities.Spell>(),
    meta: { cooldownCategories: Map<number, number>() },
  },
  castingSpellId: null,
  castRemaining: 0,
  castTarget: Branded.UnitID("enemy"),
  isCasting: false,
});

const createEnemyUnit = (): Entities.Unit => ({
  id: Branded.UnitID("enemy"),
  name: "Training Dummy",
  isPlayer: false,
  health: Entities.Power.create({ current: 1000000, max: 1000000 }),
  paperDoll: Entities.PaperDoll.create({
    class: "Boss",
    level: 83,
    armor: 0,
    avoidance: 0,
    critRating: 0,
    hasteRating: 0,
    mainStat: 0,
    masteryPercent: 0,
    stamina: 0,
    versatilityRating: 0,
  }),
  position: { x: 10, y: 0, z: 0 },
  power: Map<Entities.Types.PowerKey, Entities.Power>(),
  profiles: [],
  auras: { all: Map<Branded.SpellID, Entities.Aura>(), meta: {} },
  spells: {
    all: Map<Branded.SpellID, Entities.Spell>(),
    meta: { cooldownCategories: Map<number, number>() },
  },
  castingSpellId: null,
  castRemaining: 0,
  castTarget: null,
  isCasting: false,
});

const runSimulationEffect = () =>
  Effect.gen(function* () {
    const simulation = yield* Simulation.SimulationService;
    const units = yield* Unit.UnitService;
    const spellInfoService = yield* Data.SpellInfoService;
    const stateService = yield* State.StateService;

    const playerUnit = createPlayerUnit();
    const enemyUnit = createEnemyUnit();

    // Load spells for the player unit
    const currentState = yield* stateService.getState();
    const spellIds = [108853, 2948]; // Fire Blast, Scorch

    yield* Effect.log(`Loading spells: ${spellIds.join(", ")}`);

    const spellInfos = yield* Effect.all(
      spellIds.map((spellId) =>
        spellInfoService
          .getSpell(spellId, {
            profileIds: playerUnit.profiles,
          })
          .pipe(
            Effect.withSpan(`load-spell-${spellId}`, {
              attributes: { spellId, profiles: playerUnit.profiles.join(",") },
            }),
          ),
      ),
      { concurrency: "unbounded" },
    ).pipe(Effect.withSpan("load-all-spells"));

    yield* Effect.log(`Loaded ${spellInfos.length} spells successfully`);

    // Create Spell instances with loaded SpellInfo
    const playerSpellsMap = Map<
      Branded.SpellID,
      Entities.Spell
    >().withMutations((map) => {
      spellInfos.forEach((spellInfo) => {
        const spell = Entities.Spell.create(
          {
            charges: spellInfo.maxCharges,
            cooldownExpiry: 0,
            info: spellInfo,
          },
          currentState.currentTime,
        );
        map.set(spellInfo.id, spell);
      });
    });

    // Update player unit with loaded spells
    const playerWithSpells = {
      ...playerUnit,
      spells: {
        all: playerSpellsMap,
        meta: { cooldownCategories: Map<number, number>() },
      },
    };

    // Add units to state
    yield* Effect.log("Adding units to state");
    yield* units.add(playerWithSpells).pipe(Effect.withSpan("add-player-unit"));
    yield* units.add(enemyUnit).pipe(Effect.withSpan("add-enemy-unit"));

    // Get RotationContext AFTER units are added
    yield* Effect.log("Getting rotation context");
    const ctx = yield* RotationContext.RotationContext;

    // Define rotation
    const simpleRotation = Effect.gen(function* () {
      yield* Effect.log("Executing rotation");
      const fireBlast = yield* ctx.spells
        .get(108853)
        .pipe(Effect.withSpan("get-fire-blast"));
      const scorch = yield* ctx.spells
        .get(2948)
        .pipe(Effect.withSpan("get-scorch"));

      yield* ctx.spells
        .cast(fireBlast)
        .pipe(Effect.withSpan("cast-fire-blast"));
      yield* ctx.spells.cast(scorch).pipe(Effect.withSpan("cast-scorch"));
    }).pipe(Effect.withSpan("rotation-execution"));

    // Subscribe to snapshots and events BEFORE running simulation
    const snapshots: DomainState.GameState[] = [];
    const events: Events.SimulationEvent[] = [];

    yield* Effect.log("Subscribing to simulation events");
    const snapshotQueue = yield* PubSub.subscribe(simulation.snapshots);
    const eventQueue = yield* PubSub.subscribe(simulation.events);

    // Fork fibers to collect snapshots and events
    const snapshotCollectorFiber = yield* Effect.gen(function* () {
      while (true) {
        const snapshot = yield* Queue.take(snapshotQueue);
        snapshots.push(snapshot);
      }
    }).pipe(Effect.fork);

    const eventCollectorFiber = yield* Effect.gen(function* () {
      while (true) {
        const event = yield* Queue.take(eventQueue);
        events.push(event);
      }
    }).pipe(Effect.fork);

    // Run simulation for 10 seconds
    yield* Effect.log("Starting simulation run (10s)");
    yield* simulation.run(simpleRotation, 10000).pipe(
      Effect.withSpan("simulation-run", {
        attributes: { durationMs: 10000 },
      }),
    );

    // Wait a bit for final snapshots to be collected
    yield* Effect.sleep(100);

    // Interrupt the collector fibers
    yield* Fiber.interrupt(snapshotCollectorFiber);
    yield* Fiber.interrupt(eventCollectorFiber);

    yield* Effect.log(
      `Simulation complete. Snapshots: ${snapshots.length}, Events: ${events.length}`,
    );

    return {
      snapshots: snapshots.length,
      events: events,
      success: true,
    };
  }).pipe(Effect.withSpan("simulation-debug"));

const simulationResultDataAtom = atom<{
  snapshots: number;
  events: Events.SimulationEvent[];
  success: boolean;
  logs?: string[];
} | null>(null);

export const runSimulationAtom = atom(null, async (get, set) => {
  const supabase = get(supabaseClientAtom);
  const appLayer = createSupabaseAppLayer(supabase);

  // Capture logs during execution
  const logs: string[] = [];

  // Create a custom logger that captures log messages
  /*
  const captureLogger = {
    log: (message: string) => {
      logs.push(message);
      console.log(message);
    },
  };
  */

  // Use runPromiseExit to get proper error handling
  const exit = await Effect.runPromiseExit(
    // @ts-expect-error TODO fix this
    runSimulationEffect().pipe(
      Effect.scoped,
      Effect.provide(appLayer),
      // Enable logging for debugging with custom logger
      Effect.withLogSpan("simulation-execution"),
      // Tap into logs to capture them
      Effect.tapErrorCause((cause) =>
        Effect.sync(() => {
          logs.push(`[ERROR] ${Cause.pretty(cause)}`);
        }),
      ),
    ),
  );

  // Handle success and failure cases
  if (Exit.isSuccess(exit)) {
    const result = { ...exit.value, logs };
    set(simulationResultDataAtom, result);
    return result;
  } else {
    // Format the error using Cause.pretty for readable error messages
    const prettyError = Cause.pretty(exit.cause, {
      renderErrorCause: true,
    });

    // Extract any failures and defects for additional context
    const failures = Cause.failures(exit.cause);
    const defects = Cause.defects(exit.cause);

    // Create a structured error message
    const errorDetails = {
      message: prettyError,
      failures: failures.toJSON(),
      defects: defects.toJSON(),
      isInterrupted: Cause.isInterrupted(exit.cause),
      logs,
    };

    console.error("Simulation failed with cause:", errorDetails);

    // Store logs even on failure
    set(simulationResultDataAtom, {
      snapshots: 0,
      events: [],
      success: false,
      logs,
    });

    // Throw a readable error
    throw new Error(
      `Simulation failed:\n\n${prettyError}\n\n` +
        (failures.length > 0
          ? `Failures: ${JSON.stringify(failures.toJSON(), null, 2)}\n\n`
          : "") +
        (defects.length > 0
          ? `Defects: ${JSON.stringify(defects.toJSON(), null, 2)}`
          : ""),
    );
  }
});

export const simulationResultAtom = atom((get) =>
  get(simulationResultDataAtom),
);

export const simulationEventsAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.events ?? [];
});

export const simulationSnapshotCountAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.snapshots ?? 0;
});

export const simulationLogsAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.logs ?? [];
});

// Simulation card order management
export type SimulationCardId =
  | "controls"
  | "result"
  | "error"
  | "logs"
  | "events";

const DEFAULT_SIMULATION_ORDER: SimulationCardId[] = [
  "controls",
  "result",
  "error",
  "logs",
  "events",
];

export const simulationOrderAtom = atomWithStorage<SimulationCardId[]>(
  "simulation-order",
  DEFAULT_SIMULATION_ORDER,
);
