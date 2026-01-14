import * as Schema from "effect/Schema";

export const ModifierTreeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Parent: Schema.NumberFromString,
  Operator: Schema.NumberFromString,
  Amount: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  Asset: Schema.NumberFromString,
  SecondaryAsset: Schema.NumberFromString,
  TertiaryAsset: Schema.NumberFromString,
});

export type ModifierTreeRow = Schema.Schema.Type<typeof ModifierTreeRowSchema>;
