import { DbcError, DbcQueryError } from "@wowlab/core/Errors";
import type { Class } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";

export const transformClass = (
  id: number,
): Effect.Effect<Class.ClassDataFlat, DbcError, DbcService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const row = yield* dbc.getById("chr_classes", id);

    if (!row) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Class ${id} not found` }),
      );
    }

    return {
      color: { b: row.ClassColorB, g: row.ClassColorG, r: row.ClassColorR },
      fileName: row.Filename ?? "",
      iconFileDataId: row.IconFileDataID,
      id: row.ID,
      name: row.Name_lang ?? "",
      primaryPowerType: row.DisplayPower,
      rolesMask: row.RolesMask,
      spellClassSet: row.SpellClassSet,
    };
  });
