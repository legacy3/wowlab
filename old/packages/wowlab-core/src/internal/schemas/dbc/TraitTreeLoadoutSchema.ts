import * as Schema from "effect/Schema";

export const TraitTreeLoadoutRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  ChrSpecializationID: Schema.NumberFromString,
});

export type TraitTreeLoadoutRow = Schema.Schema.Type<
  typeof TraitTreeLoadoutRowSchema
>;
