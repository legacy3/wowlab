import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellTargetRestrictionsRowSchema = Schema.Struct({
  ConeDegrees: Schema.Number,
  DifficultyID: Schema.Number,
  ID: Schema.Number,
  MaxTargetLevel: Schema.Number,
  MaxTargets: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  TargetCreatureType: Schema.Number,
  Targets: Schema.Number,
  Width: Schema.Number,
});

export type SpellTargetRestrictionsRow = Schema.Schema.Type<
  typeof SpellTargetRestrictionsRowSchema
>;
