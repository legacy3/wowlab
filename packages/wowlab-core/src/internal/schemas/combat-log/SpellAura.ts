import * as Schema from "effect/Schema";

import {
  AuraTypeSchema,
  CombatLogEventBaseSchema,
  SpellPrefixSchema,
} from "./CombatLogEvent.js";

export const SpellAuraAppliedSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  amount: Schema.optionalWith(Schema.Number, { as: "Option" }),
  auraType: AuraTypeSchema,
  subevent: Schema.Literal("SPELL_AURA_APPLIED"),
});

export type SpellAuraApplied = Schema.Schema.Type<
  typeof SpellAuraAppliedSchema
>;

export const SpellAuraAppliedDoseSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  amount: Schema.Number,
  auraType: AuraTypeSchema,
  subevent: Schema.Literal("SPELL_AURA_APPLIED_DOSE"),
});

export type SpellAuraAppliedDose = Schema.Schema.Type<
  typeof SpellAuraAppliedDoseSchema
>;

export const SpellAuraRefreshSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  auraType: AuraTypeSchema,
  subevent: Schema.Literal("SPELL_AURA_REFRESH"),
});

export type SpellAuraRefresh = Schema.Schema.Type<
  typeof SpellAuraRefreshSchema
>;

export const SpellAuraRemovedSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  amount: Schema.optionalWith(Schema.Number, { as: "Option" }),
  auraType: AuraTypeSchema,
  subevent: Schema.Literal("SPELL_AURA_REMOVED"),
});

export type SpellAuraRemoved = Schema.Schema.Type<
  typeof SpellAuraRemovedSchema
>;

export const SpellAuraRemovedDoseSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  amount: Schema.Number,
  auraType: AuraTypeSchema,
  subevent: Schema.Literal("SPELL_AURA_REMOVED_DOSE"),
});

export type SpellAuraRemovedDose = Schema.Schema.Type<
  typeof SpellAuraRemovedDoseSchema
>;
