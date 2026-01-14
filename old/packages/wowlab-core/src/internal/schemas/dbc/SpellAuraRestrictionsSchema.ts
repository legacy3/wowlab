import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellAuraRestrictionsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  CasterAuraState: Schema.NumberFromString,
  TargetAuraState: Schema.NumberFromString,
  ExcludeCasterAuraState: Schema.NumberFromString,
  ExcludeTargetAuraState: Schema.NumberFromString,
  CasterAuraSpell: Schema.NumberFromString,
  TargetAuraSpell: Schema.NumberFromString,
  ExcludeCasterAuraSpell: Schema.NumberFromString,
  ExcludeTargetAuraSpell: Schema.NumberFromString,
  CasterAuraType: Schema.NumberFromString,
  TargetAuraType: Schema.NumberFromString,
  ExcludeCasterAuraType: Schema.NumberFromString,
  ExcludeTargetAuraType: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellAuraRestrictionsRow = Schema.Schema.Type<
  typeof SpellAuraRestrictionsRowSchema
>;
