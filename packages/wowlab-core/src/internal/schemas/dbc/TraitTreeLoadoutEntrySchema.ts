import * as Schema from "effect/Schema";

export const TraitTreeLoadoutEntryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitTreeLoadoutID: Schema.NumberFromString,
  SelectedTraitNodeID: Schema.NumberFromString,
  SelectedTraitNodeEntryID: Schema.NumberFromString,
  NumPoints: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
});

export type TraitTreeLoadoutEntryRow = Schema.Schema.Type<
  typeof TraitTreeLoadoutEntryRowSchema
>;
