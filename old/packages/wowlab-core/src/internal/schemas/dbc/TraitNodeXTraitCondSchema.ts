import * as Schema from "effect/Schema";

export const TraitNodeXTraitCondRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitCondID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
});

export type TraitNodeXTraitCondRow = Schema.Schema.Type<
  typeof TraitNodeXTraitCondRowSchema
>;
