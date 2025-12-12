import * as Schema from "effect/Schema";

export const TraitNodeGroupXTraitNodeRowSchema = Schema.Struct({
  _Index: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
});

export type TraitNodeGroupXTraitNodeRow = Schema.Schema.Type<
  typeof TraitNodeGroupXTraitNodeRowSchema
>;
