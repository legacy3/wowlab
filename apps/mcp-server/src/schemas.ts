import * as Schema from "effect/Schema";

export const AllowedTableSchema = Schema.Literal(
  "spell",
  "spell_name",
  "spell_misc",
  "spell_effect",
  "spell_power",
  "spell_cooldowns",
  "spell_categories",
  "spell_category",
  "spell_class_options",
  "spell_cast_times",
  "spell_casting_requirements",
  "spell_duration",
  "spell_range",
  "spell_radius",
  "spell_interrupts",
  "spell_empower",
  "spell_empower_stage",
  "spell_aura_options",
  "spell_target_restrictions",
  "spell_procs_per_minute",
  "spell_procs_per_minute_mod",
  "item",
  "item_sparse",
  "item_effect",
  "item_x_item_effect",
  "manifest_interface_data",
  "difficulty",
  "expected_stat",
  "expected_stat_mod",
  "content_tuning_x_expected",
);

export type AllowedTable = Schema.Schema.Type<typeof AllowedTableSchema>;

export const ALLOWED_TABLES = [
  "spell",
  "spell_name",
  "spell_misc",
  "spell_effect",
  "spell_power",
  "spell_cooldowns",
  "spell_categories",
  "spell_category",
  "spell_class_options",
  "spell_cast_times",
  "spell_casting_requirements",
  "spell_duration",
  "spell_range",
  "spell_radius",
  "spell_interrupts",
  "spell_empower",
  "spell_empower_stage",
  "spell_aura_options",
  "spell_target_restrictions",
  "spell_procs_per_minute",
  "spell_procs_per_minute_mod",
  "item",
  "item_sparse",
  "item_effect",
  "item_x_item_effect",
  "manifest_interface_data",
  "difficulty",
  "expected_stat",
  "expected_stat_mod",
  "content_tuning_x_expected",
] as const;

export const AllowedFunctionSchema = Schema.Literal(
  "getDamage",
  "getEffectsForDifficulty",
  "hasAoeDamageEffect",
  "getVarianceForDifficulty",
  "extractCooldown",
  "extractCastTime",
  "extractDuration",
  "extractRange",
  "extractRadius",
  "extractCharges",
  "extractPower",
  "extractScaling",
  "extractEmpower",
  "extractInterrupts",
  "extractClassOptions",
  "extractName",
  "extractDescription",
  "extractTargetRestrictions",
);

export type AllowedFunction = Schema.Schema.Type<typeof AllowedFunctionSchema>;

export const ALLOWED_FUNCTIONS = [
  "getDamage",
  "getEffectsForDifficulty",
  "hasAoeDamageEffect",
  "getVarianceForDifficulty",
  "extractCooldown",
  "extractCastTime",
  "extractDuration",
  "extractRange",
  "extractRadius",
  "extractCharges",
  "extractPower",
  "extractScaling",
  "extractEmpower",
  "extractInterrupts",
  "extractClassOptions",
  "extractName",
  "extractDescription",
  "extractTargetRestrictions",
] as const;

export const FilterValueSchema = Schema.Union(
  Schema.String,
  Schema.Number,
  Schema.Boolean,
  Schema.Struct({
    eq: Schema.optional(
      Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
    ),
    gt: Schema.optional(Schema.Number),
    gte: Schema.optional(Schema.Number),
    ilike: Schema.optional(Schema.String),
    like: Schema.optional(Schema.String),
    lt: Schema.optional(Schema.Number),
    lte: Schema.optional(Schema.Number),
  }),
);

export const FilterSchema = Schema.Record({
  key: Schema.String,
  value: FilterValueSchema,
});

export type Filter = Schema.Schema.Type<typeof FilterSchema>;
export type FilterValue = Schema.Schema.Type<typeof FilterValueSchema>;

export const FunctionArgSchema = Schema.Struct({
  description: Schema.optional(Schema.String),
  required: Schema.Boolean,
  type: Schema.String,
});

export const FunctionMetadataSchema = Schema.Struct({
  args: Schema.Record({
    key: Schema.String,
    value: FunctionArgSchema,
  }),
  description: Schema.String,
  name: Schema.String,
  returns: Schema.String,
});

export type FunctionMetadata = Schema.Schema.Type<
  typeof FunctionMetadataSchema
>;

export const StatusOutputSchema = Schema.Struct({
  status: Schema.Literal("healthy", "degraded", "unhealthy"),
  supabase: Schema.Struct({
    connected: Schema.Boolean,
    latencyMs: Schema.optional(Schema.Number),
  }),
  timestamp: Schema.String,
  version: Schema.String,
});

export type StatusOutput = Schema.Schema.Type<typeof StatusOutputSchema>;

export const ColumnInfoSchema = Schema.Struct({
  name: Schema.String,
  nullable: Schema.Boolean,
  type: Schema.String,
});

export const TableSchemaSchema = Schema.Struct({
  columns: Schema.Array(ColumnInfoSchema),
  table: Schema.String,
});

export const TableListSchema = Schema.Struct({
  tables: Schema.Array(Schema.String),
});

export const SchemaOutputSchema = Schema.Union(
  TableListSchema,
  TableSchemaSchema,
);

export type SchemaOutput = Schema.Schema.Type<typeof SchemaOutputSchema>;

export const SpellSearchResultSchema = Schema.Struct({
  description: Schema.String,
  id: Schema.Number,
  name: Schema.String,
});

export const ItemSearchResultSchema = Schema.Struct({
  description: Schema.String,
  id: Schema.Number,
  name: Schema.String,
});

export const SpellSearchResponseSchema = Schema.Struct({
  count: Schema.Number,
  results: Schema.Array(SpellSearchResultSchema),
});

export const ItemSearchResponseSchema = Schema.Struct({
  count: Schema.Number,
  results: Schema.Array(ItemSearchResultSchema),
});

export const SpellBatchResponseSchema = Schema.Struct({
  count: Schema.Number,
  spells: Schema.Array(Schema.Unknown),
});

export const ItemBatchResponseSchema = Schema.Struct({
  count: Schema.Number,
  items: Schema.Array(Schema.Unknown),
});

export const QueryTableResponseSchema = Schema.Struct({
  count: Schema.Number,
  rows: Schema.Array(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});

export const FunctionListResponseSchema = Schema.Struct({
  count: Schema.Number,
  functions: Schema.Array(FunctionMetadataSchema),
});

export const FunctionCallResponseSchema = Schema.Struct({
  result: Schema.Unknown,
});

export type ItemSearchResult = Schema.Schema.Type<
  typeof ItemSearchResultSchema
>;
export type SpellSearchResult = Schema.Schema.Type<
  typeof SpellSearchResultSchema
>;
