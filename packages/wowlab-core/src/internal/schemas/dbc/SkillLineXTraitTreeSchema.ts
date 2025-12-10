import * as Schema from "effect/Schema";

export const SkillLineXTraitTreeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SkillLineID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  Variant: Schema.NumberFromString,
});

export type SkillLineXTraitTreeRow = Schema.Schema.Type<
  typeof SkillLineXTraitTreeRowSchema
>;
