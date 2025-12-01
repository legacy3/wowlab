import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellTargetRestrictionsRowSchema = Schema.Struct({
  ConeDegrees: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MaxTargetLevel: Schema.NumberFromString,
  MaxTargets: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  TargetCreatureType: Schema.NumberFromString,
  Targets: Schema.NumberFromString,
  Width: Schema.NumberFromString,
});

export type SpellTargetRestrictionsRow = Schema.Schema.Type<
  typeof SpellTargetRestrictionsRowSchema
>;
