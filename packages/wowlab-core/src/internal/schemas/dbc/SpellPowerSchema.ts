import * as Schema from "effect/Schema";

export const SpellPowerRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  ManaCost: Schema.NumberFromString,
  ManaCostPerLevel: Schema.NumberFromString,
  ManaPerSecond: Schema.NumberFromString,
  PowerDisplayID: Schema.NumberFromString,
  AltPowerBarID: Schema.NumberFromString,
  PowerCostPct: Schema.NumberFromString,
  PowerCostMaxPct: Schema.NumberFromString,
  OptionalCostPct: Schema.NumberFromString,
  PowerPctPerSecond: Schema.NumberFromString,
  PowerType: Schema.NumberFromString,
  RequiredAuraSpellID: Schema.NumberFromString,
  OptionalCost: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
});

export type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerRowSchema>;
