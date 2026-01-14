import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const OverrideSpellDataRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Spells_0: Branded.SpellIDSchema,
  Spells_1: Branded.SpellIDSchema,
  Spells_2: Branded.SpellIDSchema,
  Spells_3: Branded.SpellIDSchema,
  Spells_4: Branded.SpellIDSchema,
  Spells_5: Branded.SpellIDSchema,
  Spells_6: Branded.SpellIDSchema,
  Spells_7: Branded.SpellIDSchema,
  Spells_8: Branded.SpellIDSchema,
  Spells_9: Branded.SpellIDSchema,
  PlayerActionbarFileDataID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type OverrideSpellDataRow = Schema.Schema.Type<
  typeof OverrideSpellDataRowSchema
>;
