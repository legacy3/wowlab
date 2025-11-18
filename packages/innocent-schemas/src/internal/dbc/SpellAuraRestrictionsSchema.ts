import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellAuraRestrictionsSchema = Schema.Struct({
  CasterAuraSpell: Schema.Number,
  CasterAuraState: Schema.Number,
  CasterAuraType: Schema.Number,
  DifficultyID: Schema.Number,
  ExcludeCasterAuraSpell: Schema.Number,
  ExcludeCasterAuraState: Schema.Number,
  ExcludeCasterAuraType: Schema.Number,
  ExcludeTargetAuraSpell: Schema.Number,
  ExcludeTargetAuraState: Schema.Number,
  ExcludeTargetAuraType: Schema.Number,
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  TargetAuraSpell: Schema.Number,
  TargetAuraState: Schema.Number,
  TargetAuraType: Schema.Number,
});

type SpellAuraRestrictionsRow = Schema.Schema.Type<
  typeof SpellAuraRestrictionsSchema
>;

export { SpellAuraRestrictionsSchema, type SpellAuraRestrictionsRow };
