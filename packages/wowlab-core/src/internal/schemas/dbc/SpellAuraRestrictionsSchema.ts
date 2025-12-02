import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellAuraRestrictionsRowSchema = Schema.Struct({
  CasterAuraSpell: Schema.NumberFromString,
  CasterAuraState: Schema.NumberFromString,
  CasterAuraType: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ExcludeCasterAuraSpell: Schema.NumberFromString,
  ExcludeCasterAuraState: Schema.NumberFromString,
  ExcludeCasterAuraType: Schema.NumberFromString,
  ExcludeTargetAuraSpell: Schema.NumberFromString,
  ExcludeTargetAuraState: Schema.NumberFromString,
  ExcludeTargetAuraType: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  TargetAuraSpell: Schema.NumberFromString,
  TargetAuraState: Schema.NumberFromString,
  TargetAuraType: Schema.NumberFromString,
});

export type SpellAuraRestrictionsRow = Schema.Schema.Type<
  typeof SpellAuraRestrictionsRowSchema
>;
