import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCooldownsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  CategoryRecoveryTime: Schema.NumberFromString,
  RecoveryTime: Schema.NumberFromString,
  StartRecoveryTime: Schema.NumberFromString,
  AuraSpellID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCooldownsRow = Schema.Schema.Type<
  typeof SpellCooldownsRowSchema
>;
