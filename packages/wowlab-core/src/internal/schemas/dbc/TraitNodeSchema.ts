import * as Schema from "effect/Schema";

export const TraitNodeRowSchema = Schema.Struct({
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  PosX: Schema.NumberFromString,
  PosY: Schema.NumberFromString,
  TraitSubTreeID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
});

export type TraitNodeRow = Schema.Schema.Type<typeof TraitNodeRowSchema>;
