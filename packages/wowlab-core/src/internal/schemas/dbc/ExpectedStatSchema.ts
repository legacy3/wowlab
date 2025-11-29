import * as Schema from "effect/Schema";

export const ExpectedStatRowSchema = Schema.Struct({
  ArmorConstant: Schema.Number,
  ContentSetID: Schema.Number,
  CreatureArmor: Schema.Number,
  CreatureAutoAttackDps: Schema.Number,
  CreatureHealth: Schema.Number,
  CreatureSpellDamage: Schema.Number,
  ExpansionID: Schema.Number,
  ID: Schema.Number,
  Lvl: Schema.Number,
  PlayerHealth: Schema.Number,
  PlayerMana: Schema.Number,
  PlayerPrimaryStat: Schema.Number,
  PlayerSecondaryStat: Schema.Number,
});

export type ExpectedStatRow = Schema.Schema.Type<typeof ExpectedStatRowSchema>;
