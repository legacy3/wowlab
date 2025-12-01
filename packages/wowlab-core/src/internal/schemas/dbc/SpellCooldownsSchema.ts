import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCooldownsRowSchema = Schema.Struct({
  AuraSpellID: Schema.NumberFromString,
  CategoryRecoveryTime: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  RecoveryTime: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryTime: Schema.NumberFromString,
});

export type SpellCooldownsRow = Schema.Schema.Type<
  typeof SpellCooldownsRowSchema
>;
