import * as Schema from "effect/Schema";

export const TraitNodeGroupXTraitNodeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
  _Index: Schema.NumberFromString,
});

export type TraitNodeGroupXTraitNodeRow = Schema.Schema.Type<
  typeof TraitNodeGroupXTraitNodeRowSchema
>;
