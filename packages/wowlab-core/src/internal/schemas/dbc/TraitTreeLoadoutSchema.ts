import * as Schema from "effect/Schema";

export const TraitTreeLoadoutRowSchema = Schema.Struct({
  ChrSpecializationID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
});

export type TraitTreeLoadoutRow = Schema.Schema.Type<
  typeof TraitTreeLoadoutRowSchema
>;
