import * as Schema from "effect/Schema";

export const SpellPowerRowSchema = Schema.Struct({
  AltPowerBarID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  ManaCost: Schema.NumberFromString,
  ManaCostPerLevel: Schema.NumberFromString,
  ManaPerSecond: Schema.NumberFromString,
  OptionalCost: Schema.NumberFromString,
  OptionalCostPct: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  PowerCostMaxPct: Schema.NumberFromString,
  PowerCostPct: Schema.NumberFromString,
  PowerDisplayID: Schema.NumberFromString,
  PowerPctPerSecond: Schema.NumberFromString,
  PowerType: Schema.NumberFromString,
  RequiredAuraSpellID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
});

export type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerRowSchema>;
