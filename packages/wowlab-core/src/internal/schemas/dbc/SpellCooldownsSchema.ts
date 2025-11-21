import * as Schema from "effect/Schema";
import * as Branded from "../Branded.js";

export const SpellCooldownsRowSchema = Schema.Struct({
  ID: Schema.Number,
  DifficultyID: Schema.Number,
  CategoryRecoveryTime: Schema.Number,
  RecoveryTime: Schema.Number,
  StartRecoveryTime: Schema.Number,
  AuraSpellID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCooldownsRow = Schema.Schema.Type<
  typeof SpellCooldownsRowSchema
>;
