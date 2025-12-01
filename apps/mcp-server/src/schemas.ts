import * as Schema from "effect/Schema";

// ============================================================================
// Allowed Tables (whitelisted for query_table tool)
// ============================================================================

export const AllowedTableSchema = Schema.Literal(
  // Spell tables
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
  "spell_duration",
  "spell_range",
  "spell_radius",
  "spell_interrupts",
  "spell_empower",
  "spell_empower_stage",
  "spell_aura_options",
  // Item tables
  "item",
  "item_sparse",
  "item_effect",
  "item_x_item_effect",
  // Shared tables
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
  "spell_duration",
  "spell_range",
  "spell_radius",
  "spell_interrupts",
  "spell_empower",
  "spell_empower_stage",
  "spell_aura_options",
  "item",
  "item_sparse",
  "item_effect",
  "item_x_item_effect",
  "difficulty",
  "expected_stat",
  "expected_stat_mod",
  "content_tuning_x_expected",
] as const;

// ============================================================================
// Allowed Functions (whitelisted for call_function tool)
// ============================================================================

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
] as const;

// ============================================================================
// Filter Schema for query_table
// ============================================================================

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

// ============================================================================
// Function Metadata Schema
// ============================================================================

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

// ============================================================================
// Status Output Schema
// ============================================================================

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

// ============================================================================
// Schema Output Schema
// ============================================================================

export const ColumnInfoSchema = Schema.Struct({
  name: Schema.String,
  nullable: Schema.Boolean,
  type: Schema.String,
});

export const TableSchemaSchema = Schema.Struct({
  columns: Schema.Array(ColumnInfoSchema),
  table: Schema.String,
});

export const SchemaOutputSchema = Schema.Union(
  Schema.Array(Schema.String), // List of tables
  TableSchemaSchema, // Single table schema
);

export type SchemaOutput = Schema.Schema.Type<typeof SchemaOutputSchema>;

// ============================================================================
// Search Result Schemas
// ============================================================================

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

export type ItemSearchResult = Schema.Schema.Type<
  typeof ItemSearchResultSchema
>;
export type SpellSearchResult = Schema.Schema.Type<
  typeof SpellSearchResultSchema
>;
