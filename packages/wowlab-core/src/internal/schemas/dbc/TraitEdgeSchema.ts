import * as Schema from "effect/Schema";

export const TraitEdgeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  LeftTraitNodeID: Schema.NumberFromString,
  RightTraitNodeID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  VisualStyle: Schema.NumberFromString,
});

export type TraitEdgeRow = Schema.Schema.Type<typeof TraitEdgeRowSchema>;
