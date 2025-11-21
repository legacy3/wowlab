import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Context from "@wowlab/rotation/Context";
import * as Unit from "@wowlab/services/Unit";
import * as Entities from "@wowlab/core/Entities";
import { Branded } from "@wowlab/core/Schemas";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Map, Record } from "immutable";

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  { id: 108853, name: "Fire Blast" } as any,
];

const testRotation = Effect.gen(function* () {
  const rotation = yield* Context.RotationContext;
  const unitService = yield* Unit.UnitService;

  // Create player unit with spells
  const playerId = Branded.UnitID("player");
  const spellId = Branded.SpellID(108853);

  // Create a minimal spell
  const spellInfo = Record({
    ...mockSpells[0],
    id: spellId,
    maxCharges: 1,
  } as any)();

  const spell = Entities.Spell.Spell.create(
    {
      charges: 1,
      cooldownExpiry: 0,
      info: spellInfo,
    },
    0,
  );

  const spells = {
    all: Map([[spellId, spell]]),
    meta: Record({ cooldownCategories: Map() })(),
  };

  const player = Entities.Unit.Unit.create({
    id: playerId,
    name: "Player",
    spells,
  });

  yield* unitService.add(player);

  // Use rotation actions
  const canCast = yield* rotation.spell.canCast(playerId, 108853);
  console.log("Can cast Fire Blast:", canCast);

  if (canCast) {
    yield* rotation.spell.cast(playerId, 108853);
    console.log("Cast Fire Blast");
  }

  // Control actions
  yield* rotation.control.wait(1000);
  console.log("Waited 1000ms");

  return { success: true };
});

const metadataLayer = Metadata.InMemoryMetadata({
  spells: mockSpells,
  items: [],
});

// Combine runtime + rotation layers
const baseAppLayer = createAppLayer({ metadata: metadataLayer });

const appLayer = Context.RotationContext.Default.pipe(
  Layer.provide(baseAppLayer),
  Layer.merge(baseAppLayer),
);

const main = async () => {
  const result = await Effect.runPromise(
    testRotation.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();
