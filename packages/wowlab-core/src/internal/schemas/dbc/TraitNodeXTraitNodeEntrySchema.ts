import * as Schema from "effect/Schema";

export const TraitNodeXTraitNodeEntryRowSchema = Schema.Struct({
  _Index: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  TraitNodeEntryID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
});

export type TraitNodeXTraitNodeEntryRow = Schema.Schema.Type<
  typeof TraitNodeXTraitNodeEntryRowSchema
>;
