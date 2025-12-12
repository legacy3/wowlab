import * as Schema from "effect/Schema";

export const TraitTreeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitSystemID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  FirstTraitNodeID: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  Field_10_0_0_45697_006: Schema.NumberFromString,
  Field_10_0_0_45697_007: Schema.NumberFromString,
});

export type TraitTreeRow = Schema.Schema.Type<typeof TraitTreeRowSchema>;
