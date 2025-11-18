import * as Effect from "effect/Effect";

import type { EnumDefinition, EnumField } from "./types";

import { ENUM_PATTERN, FIELD_PATTERN, TABLES_PATTERN } from "./config";

const parseEnumFields = (fieldsContent: string): Effect.Effect<EnumField[]> =>
  Effect.sync(() => {
    const fields: EnumField[] = [];
    const fieldMatches = fieldsContent.matchAll(FIELD_PATTERN);

    for (const fieldMatch of fieldMatches) {
      fields.push({
        EnumValue: parseInt(fieldMatch[2], 10),
        Name: fieldMatch[1],
      });
    }

    return fields;
  });

export const parseLuaEnums = (
  luaContent: string,
): Effect.Effect<EnumDefinition[]> =>
  Effect.gen(function* () {
    const tablesMatch = luaContent.match(TABLES_PATTERN);
    if (!tablesMatch) {
      return [];
    }

    const tablesContent = tablesMatch[1];
    const tableMatches = Array.from(tablesContent.matchAll(ENUM_PATTERN));

    const enums: EnumDefinition[] = [];

    for (const match of tableMatches) {
      const enumName = match[1];
      const enumType = match[2];
      const fieldsContent = match[3];

      if (enumType !== "Enumeration") {
        continue;
      }

      const fields = yield* parseEnumFields(fieldsContent);

      if (fields.length > 0) {
        enums.push({ Fields: fields, Name: enumName, Type: enumType });
      }
    }

    return enums;
  });
