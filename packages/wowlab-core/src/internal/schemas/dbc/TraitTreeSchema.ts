import * as Schema from "effect/Schema";

export const TraitTreeRowSchema = Schema.Struct({
  Field_10_0_0_45697_006: Schema.NumberFromString,
  Field_10_0_0_45697_007: Schema.NumberFromString,
  FirstTraitNodeID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  TraitSystemID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
});

export type TraitTreeRow = Schema.Schema.Type<typeof TraitTreeRowSchema>;
