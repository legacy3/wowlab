import { Command, Options } from "@effect/cli";
import { DBC_TABLE_NAMES } from "@wowlab/core/DbcTableRegistry";
import * as Effect from "effect/Effect";
import * as fs from "node:fs";

import { DBC_DATA_DIR } from "../shared/dbc-config.js";

const formatOption = Options.choice("format", ["json", "ts", "plain"]).pipe(
  Options.withDefault("plain"),
  Options.withDescription("Output format"),
);

const listTablesProgram = (format: "json" | "ts" | "plain") =>
  Effect.sync(() => {
    const files = fs.readdirSync(DBC_DATA_DIR);
    const allTables = files
      .filter((f) => f.endsWith(".csv"))
      .map((f) => f.replace(".csv", ""))
      .sort();

    const supported = new Set(DBC_TABLE_NAMES);
    const supportedCount = allTables.filter((t) =>
      supported.has(toSnakeCase(t)),
    ).length;

    if (format === "json") {
      const output = {
        coverage: `${((supportedCount / allTables.length) * 100).toFixed(1)}%`,
        supported: supportedCount,
        tables: allTables.map((t) => ({
          name: t,
          supported: supported.has(toSnakeCase(t)),
        })),
        total: allTables.length,
      };
      console.log(JSON.stringify(output, null, 2));
    } else if (format === "ts") {
      console.log("export const ALL_DBC_TABLES = [");
      for (const t of allTables) {
        console.log(`  "${t}",`);
      }
      console.log("] as const;");
      console.log(`\n// Total: ${allTables.length}`);
      console.log(`// Supported: ${supportedCount}`);
    } else {
      console.log(`Total tables: ${allTables.length}`);
      console.log(`Supported: ${supportedCount}`);
      console.log(
        `Coverage: ${((supportedCount / allTables.length) * 100).toFixed(1)}%\n`,
      );
      for (const t of allTables) {
        // @ts-ignore TODO Fix this
        const mark = supported.has(toSnakeCase(t)) ? "Y" : "N";
        console.log(`[${mark}] ${t}`);
      }
    }
  });

// TODO use cbange-case from npm
function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

export const listTablesCommand = Command.make(
  "list-tables",
  { format: formatOption },
  ({ format }) => listTablesProgram(format),
);
