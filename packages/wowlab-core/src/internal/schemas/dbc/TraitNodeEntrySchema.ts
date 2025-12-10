import * as Schema from "effect/Schema";

export const TraitNodeEntryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  MaxRanks: Schema.NumberFromString,
  NodeEntryType: Schema.NumberFromString,
  TraitDefinitionID: Schema.NumberFromString,
  TraitSubTreeID: Schema.NumberFromString,
});

export type TraitNodeEntryRow = Schema.Schema.Type<
  typeof TraitNodeEntryRowSchema
>;
