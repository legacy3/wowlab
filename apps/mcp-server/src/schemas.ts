import {
  DBC_TABLE_NAMES,
  isValidDbcTable,
  type DbcTableName,
} from "@wowlab/core/DbcTableRegistry";
import * as Schema from "effect/Schema";

export type AllowedTable = DbcTableName;

export const ALLOWED_TABLES = DBC_TABLE_NAMES;

export const AllowedTableSchema = Schema.String.pipe(
  Schema.filter(isValidDbcTable, {
    message: () => "Table does not exist",
  }),
);

export const AllowedFunctionSchema = Schema.Literal(
  "getDamage",
  "getEffectsForDifficulty",
  "hasAoeDamageEffect",
  "getVarianceForDifficulty",
  "extractAuraRestrictions",
  "extractCooldown",
  "extractCastTime",
  "extractDescriptionVariables",
  "extractDuration",
  "extractRange",
  "extractRadius",
  "extractCharges",
  "extractLearnSpells",
  "extractLevels",
  "extractPower",
  "extractReplacement",
  "extractScaling",
  "extractShapeshift",
  "extractEmpower",
  "extractInterrupts",
  "extractClassOptions",
  "extractName",
  "extractDescription",
  "extractTargetRestrictions",
  "extractTotems",
);

export type AllowedFunction = Schema.Schema.Type<typeof AllowedFunctionSchema>;

export const ALLOWED_FUNCTIONS = [
  "getDamage",
  "getEffectsForDifficulty",
  "hasAoeDamageEffect",
  "getVarianceForDifficulty",
  "extractAuraRestrictions",
  "extractCooldown",
  "extractCastTime",
  "extractDescriptionVariables",
  "extractDuration",
  "extractRange",
  "extractRadius",
  "extractCharges",
  "extractLearnSpells",
  "extractLevels",
  "extractPower",
  "extractReplacement",
  "extractScaling",
  "extractShapeshift",
  "extractEmpower",
  "extractInterrupts",
  "extractClassOptions",
  "extractName",
  "extractDescription",
  "extractTargetRestrictions",
  "extractTotems",
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
