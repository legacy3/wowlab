import * as State from "@wowlab/services/State";
import * as Accessors from "@wowlab/services/Accessors";
import * as Unit from "@wowlab/services/Unit";
import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const testBusinessServices = Effect.gen(function* () {
  const unitService = yield* Unit.UnitService;
  const unitAccessor = yield* Accessors.UnitAccessor;

  // Create a test unit
  const unitId = Schemas.Branded.UnitID("player");
  const unit = Entities.Unit.Unit.create({ id: unitId, name: "Test Player" });

  // Add unit
  yield* unitService.add(unit);
  console.log("Added unit:", unit.name);

  // Get unit via accessor
  const retrieved = yield* unitAccessor.get(unitId);
  console.log("Retrieved unit:", retrieved.name);

  // Update unit health
  yield* unitService.health.damage(unitId, 100);
  console.log("Damaged unit for 100");

  const updated = yield* unitAccessor.get(unitId);
  console.log("Updated health:", updated.health.current);

  return { success: true };
});

const appLayer = Layer.mergeAll(
  Accessors.UnitAccessor.Default,
  Unit.UnitService.Default,
).pipe(Layer.provide(State.StateServiceLive));

const main = async () => {
  const result = await Effect.runPromise(
    testBusinessServices.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();
