import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import { Console, Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Console.log("Verifying @wowlab/core...");

  // Create a Unit
  const unitId = Schemas.Branded.UnitID("player-1");
  const unit = Entities.Unit.Unit.create({
    id: unitId,
    level: 80,
    name: "Test Player",
  });

  yield* Console.log(`Created unit: ${unit.name} (${unit.id})`);

  // Create a Spell
  const spellId = Schemas.Branded.SpellID(123);
  const spellInfo = Entities.Spell.createNotFoundSpellInfo(spellId);
  const spell = Entities.Spell.Spell.create(
    {
      charges: 1,
      cooldownExpiry: 0,
      info: spellInfo,
    },
    0,
  );

  yield* Console.log(
    `Created spell: ${spell.info.name} (Ready: ${spell.isReady})`,
  );

  // Check Enums
  const school = Schemas.Enums.SpellSchool.Fire;
  yield* Console.log(`Spell School: ${school}`);

  yield* Console.log("Verification complete!");
});

Effect.runPromise(program);
