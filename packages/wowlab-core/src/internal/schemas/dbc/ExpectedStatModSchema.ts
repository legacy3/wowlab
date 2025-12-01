import * as Schema from "effect/Schema";

export const ExpectedStatModRowSchema = Schema.Struct({
  ArmorConstantMod: Schema.NumberFromString,
  CreatureArmorMod: Schema.NumberFromString,
  CreatureAutoAttackDPSMod: Schema.NumberFromString,
  CreatureHealthMod: Schema.NumberFromString,
  CreatureSpellDamageMod: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  PlayerHealthMod: Schema.NumberFromString,
  PlayerManaMod: Schema.NumberFromString,
  PlayerPrimaryStatMod: Schema.NumberFromString,
  PlayerSecondaryStatMod: Schema.NumberFromString,
});

export type ExpectedStatModRow = Schema.Schema.Type<
  typeof ExpectedStatModRowSchema
>;
