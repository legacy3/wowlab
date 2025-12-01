import * as Schema from "effect/Schema";

export const ExpectedStatRowSchema = Schema.Struct({
  ArmorConstant: Schema.NumberFromString,
  ContentSetID: Schema.NumberFromString,
  CreatureArmor: Schema.NumberFromString,
  CreatureAutoAttackDps: Schema.NumberFromString,
  CreatureHealth: Schema.NumberFromString,
  CreatureSpellDamage: Schema.NumberFromString,
  ExpansionID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Lvl: Schema.NumberFromString,
  PlayerHealth: Schema.NumberFromString,
  PlayerMana: Schema.NumberFromString,
  PlayerPrimaryStat: Schema.NumberFromString,
  PlayerSecondaryStat: Schema.NumberFromString,
});

export type ExpectedStatRow = Schema.Schema.Type<typeof ExpectedStatRowSchema>;
