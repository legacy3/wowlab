import * as Schema from "effect/Schema";

export const PowerTypeRowSchema = Schema.Struct({
  NameGlobalStringTag: Schema.String,
  CostGlobalStringTag: Schema.String,
  ID: Schema.NumberFromString,
  PowerTypeEnum: Schema.NumberFromString,
  MinPower: Schema.NumberFromString,
  MaxBasePower: Schema.NumberFromString,
  CenterPower: Schema.NumberFromString,
  DefaultPower: Schema.NumberFromString,
  DisplayModifier: Schema.NumberFromString,
  RegenInterruptTimeMS: Schema.NumberFromString,
  RegenPeace: Schema.NumberFromString,
  RegenCombat: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type PowerTypeRow = Schema.Schema.Type<typeof PowerTypeRowSchema>;
