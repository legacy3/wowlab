import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellTargetRestrictionsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ConeDegrees: Schema.NumberFromString,
  MaxTargets: Schema.NumberFromString,
  MaxTargetLevel: Schema.NumberFromString,
  TargetCreatureType: Schema.NumberFromString,
  Targets: Schema.NumberFromString,
  Width: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellTargetRestrictionsRow = Schema.Schema.Type<
  typeof SpellTargetRestrictionsRowSchema
>;
