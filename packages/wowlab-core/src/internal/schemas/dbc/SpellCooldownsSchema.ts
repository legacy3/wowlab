import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCooldownsRowSchema = Schema.Struct({
  AuraSpellID: Schema.Number,
  CategoryRecoveryTime: Schema.Number,
  DifficultyID: Schema.Number,
  ID: Schema.Number,
  RecoveryTime: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryTime: Schema.Number,
});

export type SpellCooldownsRow = Schema.Schema.Type<
  typeof SpellCooldownsRowSchema
>;
