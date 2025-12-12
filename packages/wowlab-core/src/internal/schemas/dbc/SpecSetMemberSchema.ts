import * as Schema from "effect/Schema";

export const SpecSetMemberRowSchema = Schema.Struct({
  ChrSpecializationID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  SpecSet: Schema.NumberFromString,
});

export type SpecSetMemberRow = Schema.Schema.Type<
  typeof SpecSetMemberRowSchema
>;
