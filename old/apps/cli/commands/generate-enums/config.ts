import * as path from "node:path";

export const WOW_UI_SOURCE_PATH = path.join(
  process.cwd(),
  "third_party",
  "wow-ui-source",
);

export const WOW_DOCS_PATH = path.join(
  WOW_UI_SOURCE_PATH,
  "Interface",
  "AddOns",
  "Blizzard_APIDocumentationGenerated",
);

export const OUTPUT_PATH = path.join(
  process.cwd(),
  "packages",
  "wowlab-core",
  "src",
  "schemas",
  "enums",
);

export const ENUM_PATTERN =
  /\{\s*Name\s*=\s*"([^"]+)"[\s\S]*?Type\s*=\s*"(Enumeration)"[\s\S]*?Fields\s*=\s*\{([\s\S]*?)\n\s*\},?\s*\}/g;

export const FIELD_PATTERN =
  /\{\s*Name\s*=\s*"([^"]+)"[\s\S]*?EnumValue\s*=\s*(-?\d+)\s*\}/g;

export const TABLES_PATTERN = /Tables\s*=\s*\{([\s\S]*?)\n\};/;
