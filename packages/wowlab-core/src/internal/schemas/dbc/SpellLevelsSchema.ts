import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellLevelsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  MaxLevel: Schema.NumberFromString,
  MaxPassiveAuraLevel: Schema.NumberFromString,
  BaseLevel: Schema.NumberFromString,
  SpellLevel: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellLevelsRow = Schema.Schema.Type<typeof SpellLevelsRowSchema>;
