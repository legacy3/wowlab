import * as Schema from "effect/Schema";

export const TraitNodeXTraitNodeEntryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
  TraitNodeEntryID: Schema.NumberFromString,
  _Index: Schema.NumberFromString,
});

export type TraitNodeXTraitNodeEntryRow = Schema.Schema.Type<
  typeof TraitNodeXTraitNodeEntryRowSchema
>;
