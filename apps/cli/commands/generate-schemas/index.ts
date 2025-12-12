import { Command, Options } from "@effect/cli";
import * as FileSystem from "@effect/platform/FileSystem";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  fieldTypeToSchemaCode,
  getFieldType,
  needsBrandedImport,
} from "./overrides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DBC_DATA_DIR = path.join(
  __dirname,
  "../../../../third_party/wowlab-data/data/tables",
);

const SCHEMA_OUTPUT_DIR = path.join(
  __dirname,
  "../../../../packages/wowlab-core/src/internal/schemas/dbc",
);

const allOption = Options.boolean("all").pipe(
  Options.withDefault(false),
  Options.withDescription(
    "Generate schemas for all CSV files, not just existing ones.",
  ),
);

const tablesOption = Options.text("tables").pipe(
  Options.repeated,
  Options.withDescription(
    "Specific table names to generate (without .csv extension). Can be specified multiple times.",
  ),
);

const dryRunOption = Options.boolean("dry-run").pipe(
  Options.withDefault(false),
  Options.withDescription(
    "Show what would be generated without writing files.",
  ),
);

function csvToSchemaName(csvFile: string): string {
  return csvFile.replace(/\.csv$/i, "");
}

function generateSchemaCode(tableName: string, fields: string[]): string {
  const fieldLines = fields.map((field) => {
    const fieldType = getFieldType(tableName, field);
    const schemaCode = fieldTypeToSchemaCode(fieldType);
    
    return `  ${field}: ${schemaCode},`;
  });

  const schemaName = `${tableName}RowSchema`;
  const typeName = `${tableName}Row`;

  const brandedImport = needsBrandedImport(tableName)
    ? '\nimport * as Branded from "../Branded.js";\n'
    : "";

  return `import * as Schema from "effect/Schema";
${brandedImport}
export const ${schemaName} = Schema.Struct({
${fieldLines.join("\n")}
});

export type ${typeName} = Schema.Schema.Type<typeof ${schemaName}>;
`;
}

function parseCsvHeader(content: string): string[] {
  const firstLine = content.split("\n")[0];
  if (!firstLine) {
    return [];
  }

  return firstLine
    .split(",")
    .map((field) => field.trim().replace(/^"/, "").replace(/"$/, ""));
}

const getExistingSchemas = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const files = yield* fs.readDirectory(SCHEMA_OUTPUT_DIR);

  return files
    .filter((f) => f.endsWith("Schema.ts") && f !== "index.ts")
    .map((f) => f.replace(/Schema\.ts$/, ""));
});

const getAllCsvFiles = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const files = yield* fs.readDirectory(DBC_DATA_DIR);

  return files.filter((f) => f.endsWith(".csv")).map((f) => csvToSchemaName(f));
});

const generateTableSchema = (tableName: string, dryRun: boolean) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const csvPath = path.join(DBC_DATA_DIR, `${tableName}.csv`);
    const schemaPath = path.join(SCHEMA_OUTPUT_DIR, `${tableName}Schema.ts`);

    // Check if CSV exists
    const csvExists = yield* fs.exists(csvPath);
    if (!csvExists) {
      yield* Effect.logWarning(`CSV file not found: ${tableName}.csv`);
      return false;
    }

    // Read CSV header
    const content = yield* fs.readFileString(csvPath, "utf8");
    const fields = parseCsvHeader(content);

    if (fields.length === 0) {
      yield* Effect.logWarning(`No fields found in ${tableName}.csv`);
      return false;
    }

    // Generate schema code
    const schemaCode = generateSchemaCode(tableName, fields);

    if (dryRun) {
      yield* Effect.logInfo(
        `[DRY RUN] Would generate ${tableName}Schema.ts with ${fields.length} fields`,
      );
      yield* Effect.logDebug(`Fields: ${fields.sort().join(", ")}`);
    } else {
      yield* fs.writeFileString(schemaPath, schemaCode);
      yield* Effect.logInfo(
        `Generated ${tableName}Schema.ts with ${fields.length} fields`,
      );
    }

    return true;
  });

const generateSchemasProgram = (
  all: boolean,
  tables: ReadonlyArray<string>,
  dryRun: boolean,
) =>
  Effect.gen(function* () {
    let tablesToGenerate: string[];

    if (tables.length > 0) {
      // Use specified tables
      tablesToGenerate = [...tables];
      yield* Effect.logInfo(
        `Generating schemas for ${tablesToGenerate.length} specified tables...`,
      );
    } else if (all) {
      // Generate for all CSV files
      tablesToGenerate = yield* getAllCsvFiles;
      yield* Effect.logInfo(
        `Generating schemas for all ${tablesToGenerate.length} CSV files...`,
      );
    } else {
      // Only update existing schema files
      tablesToGenerate = yield* getExistingSchemas;
      yield* Effect.logInfo(
        `Updating ${tablesToGenerate.length} existing schema files...`,
      );
    }

    let successCount = 0;
    for (const tableName of tablesToGenerate.sort()) {
      const success = yield* generateTableSchema(tableName, dryRun);

      if (success) {
        successCount++;
      }
    }

    const modeLabel = dryRun ? "[DRY RUN] " : "";

    yield* Effect.logInfo(
      `\n${modeLabel}Complete! Generated ${successCount}/${tablesToGenerate.length} schemas.`,
    );

    return successCount;
  });

export const generateSchemasCommand = Command.make(
  "generate-schemas",
  { all: allOption, dryRun: dryRunOption, tables: tablesOption },
  ({ all, dryRun, tables }) => generateSchemasProgram(all, tables, dryRun),
);
