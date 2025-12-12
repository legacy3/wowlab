import * as Schema from "effect/Schema";

export const TraitNodeGroupRowSchema = Schema.Struct({
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
});

export type TraitNodeGroupRow = Schema.Schema.Type<
  typeof TraitNodeGroupRowSchema
>;
