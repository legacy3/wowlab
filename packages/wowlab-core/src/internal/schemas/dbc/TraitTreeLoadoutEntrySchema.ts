import * as Schema from "effect/Schema";

export const TraitTreeLoadoutEntryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  NumPoints: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  SelectedTraitNodeEntryID: Schema.NumberFromString,
  SelectedTraitNodeID: Schema.NumberFromString,
  TraitTreeLoadoutID: Schema.NumberFromString,
});

export type TraitTreeLoadoutEntryRow = Schema.Schema.Type<
  typeof TraitTreeLoadoutEntryRowSchema
>;
