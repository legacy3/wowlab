import * as Schema from "effect/Schema";

export const SpecSetMemberRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ChrSpecializationID: Schema.NumberFromString,
  SpecSet: Schema.NumberFromString,
});

export type SpecSetMemberRow = Schema.Schema.Type<
  typeof SpecSetMemberRowSchema
>;
