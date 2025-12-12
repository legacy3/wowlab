import * as Schema from "effect/Schema";

export const ExpectedStatRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ExpansionID: Schema.NumberFromString,
  CreatureHealth: Schema.NumberFromString,
  PlayerHealth: Schema.NumberFromString,
  CreatureAutoAttackDps: Schema.NumberFromString,
  CreatureArmor: Schema.NumberFromString,
  PlayerMana: Schema.NumberFromString,
  PlayerPrimaryStat: Schema.NumberFromString,
  PlayerSecondaryStat: Schema.NumberFromString,
  ArmorConstant: Schema.NumberFromString,
  CreatureSpellDamage: Schema.NumberFromString,
  ContentSetID: Schema.NumberFromString,
  Lvl: Schema.NumberFromString,
});

export type ExpectedStatRow = Schema.Schema.Type<typeof ExpectedStatRowSchema>;
