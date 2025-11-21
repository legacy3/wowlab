import * as Schemas from "@wowlab/core/Schemas";
import * as Metadata from "@wowlab/services/Metadata";
import * as Effect from "effect/Effect";

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    id: 108853,
    name: "Fire Blast",
    school: Schemas.Enums.SpellSchool.Fire,
    // ... other required fields
  } as unknown as Schemas.Spell.SpellDataFlat,
  {
    id: 2948,
    name: "Scorch",
    school: Schemas.Enums.SpellSchool.Fire,
    // ... other required fields
  } as unknown as Schemas.Spell.SpellDataFlat,
];

const testMetadata = Effect.gen(function* () {
  const metadata = yield* Metadata.MetadataService;

  // Load Fire Blast
  const fireBlast = yield* metadata.loadSpell(
    108853 as Schemas.Branded.SpellID,
  );
  console.log("Loaded spell:", fireBlast.name);

  // Load Scorch
  const scorch = yield* metadata.loadSpell(2948 as Schemas.Branded.SpellID);
  console.log("Loaded spell:", scorch.name);

  // Test error handling
  const missing = yield* Effect.either(
    metadata.loadSpell(99999 as Schemas.Branded.SpellID),
  );
  if (missing._tag === "Left") {
    console.log("Error handled correctly:", missing.left);
  }

  return { spells: [fireBlast, scorch], success: true };
});

const metadataLayer = Metadata.InMemoryMetadata({
  items: [],
  spells: mockSpells,
});

const main = async () => {
  const result = await Effect.runPromise(
    testMetadata.pipe(Effect.provide(metadataLayer)),
  );
  console.log("Result:", result);
};

main();
