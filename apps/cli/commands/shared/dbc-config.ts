import {
  DBC_TABLES,
  DBC_TABLE_KEYS,
  type DbcTableKey,
  type DbcTableMapping,
} from "@wowlab/core/DbcTableRegistry";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DBC_DATA_DIR = path.join(
  __dirname,
  "../../../../third_party/wowlab-data/data/tables",
);

export { DBC_TABLES, DBC_TABLE_KEYS };
export type { DbcTableKey, DbcTableMapping };
