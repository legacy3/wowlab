import * as Services from "@wowlab/services";
import { Console, Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Console.log("Verifying @wowlab/services...");

  // Check Service Tags
  yield* Console.log(`StateService Tag: ${Services.State.StateService.key}`);
  yield* Console.log(`LogService Tag: ${Services.Log.LogService.key}`);
  yield* Console.log(`RNGService Tag: ${Services.Rng.RNGService.key}`);
  yield* Console.log(
    `MetadataService Tag: ${Services.Metadata.MetadataService.key}`,
  );
  yield* Console.log(
    `EventSchedulerService Tag: ${Services.Scheduler.EventSchedulerService.key}`,
  );
  yield* Console.log(
    `SpellInfoService Tag: ${Services.Data.SpellInfoService.key}`,
  );
  yield* Console.log(`UnitService Tag: ${Services.Unit.UnitService.key}`);
  yield* Console.log(`SpellService Tag: ${Services.Spell.SpellService.key}`);
  yield* Console.log(
    `SimulationService Tag: ${Services.Simulation.SimulationService.key}`,
  );

  yield* Console.log("Verification complete!");
});

Effect.runPromise(program);
