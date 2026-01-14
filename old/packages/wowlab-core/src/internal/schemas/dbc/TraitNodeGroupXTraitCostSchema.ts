import * as Schema from "effect/Schema";

export const TraitNodeGroupXTraitCostRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
  TraitCostID: Schema.NumberFromString,
});

export type TraitNodeGroupXTraitCostRow = Schema.Schema.Type<
  typeof TraitNodeGroupXTraitCostRowSchema
>;
