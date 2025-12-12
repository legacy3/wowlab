import * as Schema from "effect/Schema";

export const TraitNodeGroupRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type TraitNodeGroupRow = Schema.Schema.Type<
  typeof TraitNodeGroupRowSchema
>;
