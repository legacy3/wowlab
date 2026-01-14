import * as Schema from "effect/Schema";

export const TraitNodeGroupXTraitCondRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitCondID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
});

export type TraitNodeGroupXTraitCondRow = Schema.Schema.Type<
  typeof TraitNodeGroupXTraitCondRowSchema
>;
