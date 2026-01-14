import * as Schema from "effect/Schema";

export const TraitNodeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  PosX: Schema.NumberFromString,
  PosY: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  TraitSubTreeID: Schema.NumberFromString,
});

export type TraitNodeRow = Schema.Schema.Type<typeof TraitNodeRowSchema>;
