import * as Events from "@wowlab/core/Events";
import * as Accessors from "@wowlab/services/Accessors";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Simulation from "@wowlab/services/Simulation";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const testSimulation = Effect.gen(function* () {
  const sim = yield* Simulation.SimulationService;
  const scheduler = yield* Scheduler.EventSchedulerService;

  // Schedule a test event
  yield* scheduler.schedule({
    execute: Effect.sync(() => console.log("Event executed!")),
    id: "test-event",
    payload: {
      amount: 100,
      casterId: "player",
      isCrit: false,
      spellId: 1,
      targetId: "target",
    },
    priority: 0,
    time: 1000,
    type: Events.EventType.SPELL_DAMAGE,
  } as unknown as Events.SimulationEvent);

  // Subscribe to snapshots
  const snapshots: unknown[] = [];
  yield* sim.subscribeSnapshots((snapshot) => {
    snapshots.push(snapshot);
  });

  // Run simulation for 5 seconds
  const result = yield* sim.run(5000);

  console.log("Simulation complete");
  console.log("Final time:", result.finalTime);
  console.log("Snapshots collected:", snapshots.length);

  return { snapshots: snapshots.length, success: true };
});

const appLayer = Layer.mergeAll(
  Accessors.UnitAccessor.Default,
  Scheduler.EventSchedulerService.Default,
  Unit.UnitService.Default,
  Simulation.SimulationService.Default,
).pipe(Layer.provide(State.StateServiceLive));


const main = async () => {
  const result = await Effect.runPromise(
    testSimulation.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();

