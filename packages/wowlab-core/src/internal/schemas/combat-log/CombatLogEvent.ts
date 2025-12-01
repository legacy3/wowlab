import * as Schema from "effect/Schema";

// Base fields present on all combat log events
export const CombatLogEventBaseSchema = Schema.Struct({
  destFlags: Schema.Number,
  destGUID: Schema.String,
  destName: Schema.String,
  sourceFlags: Schema.Number,
  sourceGUID: Schema.String,
  sourceName: Schema.String,
  subevent: Schema.String,
  timestamp: Schema.Number,
});

export type CombatLogEventBase = Schema.Schema.Type<
  typeof CombatLogEventBaseSchema
>;

// Spell prefix fields
export const SpellPrefixSchema = Schema.Struct({
  spellId: Schema.Number,
  spellName: Schema.String,
  spellSchool: Schema.Number,
});

export type SpellPrefix = Schema.Schema.Type<typeof SpellPrefixSchema>;

export const AuraTypeSchema = Schema.Literal("BUFF", "DEBUFF");
export type AuraType = Schema.Schema.Type<typeof AuraTypeSchema>;
