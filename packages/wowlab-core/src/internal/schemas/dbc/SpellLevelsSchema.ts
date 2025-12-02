import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellLevelsRowSchema = Schema.Struct({
  BaseLevel: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MaxLevel: Schema.NumberFromString,
  MaxPassiveAuraLevel: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  SpellLevel: Schema.NumberFromString,
});

export type SpellLevelsRow = Schema.Schema.Type<typeof SpellLevelsRowSchema>;
