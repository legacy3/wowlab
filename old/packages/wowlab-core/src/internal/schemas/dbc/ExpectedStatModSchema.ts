import * as Schema from "effect/Schema";

export const ExpectedStatModRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  CreatureHealthMod: Schema.NumberFromString,
  PlayerHealthMod: Schema.NumberFromString,
  CreatureAutoAttackDPSMod: Schema.NumberFromString,
  CreatureArmorMod: Schema.NumberFromString,
  PlayerManaMod: Schema.NumberFromString,
  PlayerPrimaryStatMod: Schema.NumberFromString,
  PlayerSecondaryStatMod: Schema.NumberFromString,
  ArmorConstantMod: Schema.NumberFromString,
  CreatureSpellDamageMod: Schema.NumberFromString,
});

export type ExpectedStatModRow = Schema.Schema.Type<
  typeof ExpectedStatModRowSchema
>;
