import * as Schema from "effect/Schema";

export const ExpectedStatModRowSchema = Schema.Struct({
  ArmorConstantMod: Schema.Number,
  CreatureArmorMod: Schema.Number,
  CreatureAutoAttackDPSMod: Schema.Number,
  CreatureHealthMod: Schema.Number,
  CreatureSpellDamageMod: Schema.Number,
  ID: Schema.Number,
  PlayerHealthMod: Schema.Number,
  PlayerManaMod: Schema.Number,
  PlayerPrimaryStatMod: Schema.Number,
  PlayerSecondaryStatMod: Schema.Number,
});

export type ExpectedStatModRow = Schema.Schema.Type<
  typeof ExpectedStatModRowSchema
>;
